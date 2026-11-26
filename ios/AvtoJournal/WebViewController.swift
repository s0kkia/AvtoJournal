import UIKit
import WebKit

/// Hosts the existing АвтоЖурнал web app inside a WKWebView and provides the
/// native side of the JavaScript bridges that the Android build exposes as
/// `AndroidBridge` and `UpdateBridge`.
///
/// The JavaScript bridge is synchronous (the web code expects return values),
/// so we use the classic `prompt()` bridge: `prompt("AJBRIDGE:<json>")` is
/// intercepted in `runJavaScriptTextInputPanelWithPrompt` and answered with a
/// string. No dialog is shown to the user.
final class WebViewController: UIViewController, WKUIDelegate, WKNavigationDelegate {

    private var webView: WKWebView!

    private static let bridgePrefix = "AJBRIDGE:"

    private static let backgroundColor = UIColor(red: 0.043, green: 0.055, blue: 0.075, alpha: 1)

    override func viewDidLoad() {
        super.viewDidLoad()

        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.userContentController.addUserScript(
            WKUserScript(source: Self.bridgeShim,
                         injectionTime: .atDocumentStart,
                         forMainFrameOnly: true)
        )

        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.uiDelegate = self
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = Self.backgroundColor
        webView.scrollView.backgroundColor = Self.backgroundColor
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        view.addSubview(webView)

        loadApp()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        traitCollection.userInterfaceStyle == .light ? .darkContent : .lightContent
    }

    private func loadApp() {
        guard let url = Bundle.main.url(forResource: "index",
                                        withExtension: "html",
                                        subdirectory: "Web") else {
            assertionFailure("index.html not found in Web/ resource folder")
            return
        }
        webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }

    // MARK: - Synchronous JS bridge

    func webView(_ webView: WKWebView,
                 runJavaScriptTextInputPanelWithPrompt prompt: String,
                 defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        guard prompt.hasPrefix(Self.bridgePrefix) else {
            completionHandler(defaultText)
            return
        }
        let json = String(prompt.dropFirst(Self.bridgePrefix.count))
        completionHandler(handleBridge(json))
    }

    private func handleBridge(_ json: String) -> String {
        guard
            let data = json.data(using: .utf8),
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let command = object["cmd"] as? String
        else {
            return ""
        }
        let payload = object["payload"] as? [String: Any] ?? [:]

        switch command {
        case "saveBase64":
            return saveBase64(payload)
        case "setTheme":
            applyTheme(payload["theme"] as? String ?? "auto")
            return "OK"
        case "openUrl":
            if let raw = payload["url"] as? String, let url = URL(string: raw) {
                DispatchQueue.main.async { UIApplication.shared.open(url) }
            }
            return "OK"
        default:
            return ""
        }
    }

    /// Decodes a base64 payload, writes it to the app's Documents directory and
    /// presents the share sheet so the user can save/share the file (PDF, JSON
    /// backup, etc.). Returns the resulting path, or `ERR:<reason>`.
    private func saveBase64(_ payload: [String: Any]) -> String {
        let name = (payload["name"] as? String) ?? "file"
        guard let base64 = payload["b64"] as? String,
              let data = Data(base64Encoded: base64) else {
            return "ERR:decode"
        }

        let safeName = name.replacingOccurrences(of: "/", with: "_")
        let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        var url = directory.appendingPathComponent(safeName)

        if FileManager.default.fileExists(atPath: url.path) {
            let base = (safeName as NSString).deletingPathExtension
            let ext = (safeName as NSString).pathExtension
            let stamp = Int(Date().timeIntervalSince1970)
            let unique = ext.isEmpty ? "\(base)-\(stamp)" : "\(base)-\(stamp).\(ext)"
            url = directory.appendingPathComponent(unique)
        }

        do {
            try data.write(to: url, options: .atomic)
        } catch {
            return "ERR:write"
        }

        DispatchQueue.main.async { [weak self] in
            self?.presentShareSheet(for: url)
        }
        return url.path
    }

    private func presentShareSheet(for url: URL) {
        let controller = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        if let popover = controller.popoverPresentationController {
            popover.sourceView = view
            popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        present(controller, animated: true)
    }

    private func applyTheme(_ theme: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            switch theme {
            case "light": self.overrideUserInterfaceStyle = .light
            case "dark": self.overrideUserInterfaceStyle = .dark
            default: self.overrideUserInterfaceStyle = .unspecified
            }
            self.setNeedsStatusBarAppearanceUpdate()
        }
    }

    // MARK: - Bridge shim injected into the page

    /// Mirrors the Android `AndroidBridge` / `UpdateBridge` API on top of the
    /// synchronous `prompt()` channel. `UpdateBridge` is a no-op on iOS because
    /// iOS cannot sideload APK updates; OTA is disabled in the web layer too.
    private static let bridgeShim = """
    (function () {
      window.IS_IOS = true;

      function call(cmd, payload) {
        try {
          return prompt('AJBRIDGE:' + JSON.stringify({ cmd: cmd, payload: payload || {} }));
        } catch (e) {
          return null;
        }
      }

      window.AndroidBridge = {
        saveBase64: function (name, mime, b64) {
          return call('saveBase64', { name: name, mime: mime, b64: b64 }) || '';
        },
        setTheme: function (theme) { call('setTheme', { theme: theme }); },
        openUrl: function (url) { call('openUrl', { url: url }); }
      };

      window.UpdateBridge = {
        start: function () { return -1; },
        status: function () { return JSON.stringify({ status: -2 }); },
        install: function () { return false; },
        cancel: function () { return false; }
      };
    })();
    """
}
