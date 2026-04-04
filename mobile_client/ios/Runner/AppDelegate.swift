import UIKit
import Flutter
import GoogleMaps
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@main
@objc class AppDelegate: FlutterAppDelegate {

    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // ─── Google Maps ─────────────────────────────────────────────────────
        // La API Key se lee desde Info.plist (GMSApiKey)
        // En producción asegúrate de restringir la key a Bundle ID: com.mmdriver.driver
        if let apiKey = Bundle.main.object(forInfoDictionaryKey: "GMSApiKey") as? String,
           !apiKey.isEmpty, apiKey != "$(GOOGLE_MAPS_API_KEY)" {
            GMSServices.provideAPIKey(apiKey)
        } else {
            print("⚠️ M&M Driver: GOOGLE_MAPS_API_KEY no configurada en Info.plist")
        }

        // ─── Firebase ────────────────────────────────────────────────────────
        FirebaseApp.configure()

        // ─── Push Notifications ──────────────────────────────────────────────
        UNUserNotificationCenter.current().delegate = self
        Messaging.messaging().delegate = self
        application.registerForRemoteNotifications()

        // ─── Flutter ─────────────────────────────────────────────────────────
        GeneratedPluginRegistrant.register(with: self)

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    // ─── Remote Notifications ─────────────────────────────────────────────────

    override func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Messaging.messaging().apnsToken = deviceToken
        super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
    }

    override func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("⚠️ M&M Driver: No se pudo registrar para notificaciones push: \(error)")
    }

    // ─── Deep Links ──────────────────────────────────────────────────────────

    override func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        // mmdriver://trip/:id — manejado por go_router en Flutter
        return super.application(app, open: url, options: options)
    }

    // ─── Universal Links ─────────────────────────────────────────────────────

    override func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        // https://app.mmdriver.com/share/:token
        return super.application(application,
                                  continue: userActivity,
                                  restorationHandler: restorationHandler)
    }
}

// ─── Firebase Cloud Messaging Delegate ───────────────────────────────────────

extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        // El token FCM se envía al backend via push_notification_service.dart
        if let token = fcmToken {
            print("ℹ️ M&M Driver FCM Token: \(token.prefix(20))...")
            NotificationCenter.default.post(
                name: Notification.Name("FCMToken"),
                object: nil,
                userInfo: ["token": token]
            )
        }
    }
}

// ─── UNUserNotificationCenter Delegate ───────────────────────────────────────

extension AppDelegate: UNUserNotificationCenterDelegate {
    /// Muestra notificaciones cuando la app está en primer plano
    override func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    /// Maneja tap en notificación
    override func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // El payload se procesa en push_notification_service.dart
        completionHandler()
    }
}
