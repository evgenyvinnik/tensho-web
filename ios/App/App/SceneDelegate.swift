import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    // Locking the screen only deactivates the scene. WebKit still counts the
    // page as visible, so no visibilitychange reaches it and the music would
    // play on under the lock screen. AudioSystem listens for these instead.
    func sceneWillResignActive(_ scene: UIScene) {
        triggerPageEvent("appinactive")
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        triggerPageEvent("appactive")
    }

    private func triggerPageEvent(_ name: String) {
        guard let bridge = (window?.rootViewController as? CAPBridgeViewController)?.bridge,
              bridge.webView?.isLoading == false else { return }
        bridge.triggerDocumentJSEvent(eventName: name)
    }
}
