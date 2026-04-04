import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../features/auth/data/models/user_model.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/home/presentation/screens/client_home_screen.dart';
import '../../features/home/presentation/screens/driver_home_screen.dart';
import '../../features/home/presentation/screens/supervisor_home_screen.dart';
import '../../features/trips/presentation/screens/trip_request_screen.dart';
import '../../features/trips/presentation/screens/trip_tracking_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/medical/presentation/screens/medical_profile_screen.dart';
import '../../features/sos/presentation/screens/sos_screen.dart';
import 'route_names.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: RouteNames.login,
    redirect: (BuildContext context, GoRouterState state) {
      final isLoading = authState is AuthStateLoading;
      final isAuthenticated = authState is AuthStateAuthenticated;
      final isLoginOrRegister =
          state.matchedLocation == RouteNames.login ||
          state.matchedLocation == RouteNames.register;

      if (isLoading) return null;

      if (!isAuthenticated && !isLoginOrRegister) {
        return RouteNames.login;
      }

      if (isAuthenticated && isLoginOrRegister) {
        final user = (authState as AuthStateAuthenticated).user;
        return _homeForRole(user.role);
      }

      return null;
    },
    routes: [
      // Auth
      GoRoute(
        path: RouteNames.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteNames.register,
        builder: (context, state) => const RegisterScreen(),
      ),

      // Home — per role
      GoRoute(
        path: RouteNames.clientHome,
        builder: (context, state) => const ClientHomeScreen(),
      ),
      GoRoute(
        path: RouteNames.driverHome,
        builder: (context, state) => const DriverHomeScreen(),
      ),
      GoRoute(
        path: RouteNames.supervisorHome,
        builder: (context, state) => const SupervisorHomeScreen(),
      ),

      // Trips
      GoRoute(
        path: RouteNames.tripRequest,
        builder: (context, state) => const TripRequestScreen(),
      ),
      GoRoute(
        path: RouteNames.tripTracking,
        builder: (context, state) {
          final tripId = state.pathParameters['id'] ?? '';
          return TripTrackingScreen(tripId: tripId);
        },
      ),

      // Profile
      GoRoute(
        path: RouteNames.profile,
        builder: (context, state) => const ProfileScreen(),
      ),

      // Medical profile
      GoRoute(
        path: RouteNames.medical,
        builder: (context, state) => const MedicalProfileScreen(),
      ),

      // SOS
      GoRoute(
        path: RouteNames.sos,
        builder: (context, state) {
          final tripId = state.pathParameters['tripId'] ?? '';
          return SosScreen(tripId: tripId);
        },
      ),
    ],
  );
});

String _homeForRole(UserRole role) {
  switch (role) {
    case UserRole.client:
      return RouteNames.clientHome;
    case UserRole.driver:
      return RouteNames.driverHome;
    case UserRole.supervisor:
    case UserRole.superadmin:
      return RouteNames.supervisorHome;
  }
}
