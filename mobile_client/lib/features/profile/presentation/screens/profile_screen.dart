import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/router/route_names.dart';
import '../../../auth/data/models/user_model.dart';

// Design tokens
const Color _gold = Color(0xFFD4AF37);
const Color _navy = Color(0xFF0D1B2A);
const Color _navyCard = Color(0xFF1A2340);
const Color _red = Color(0xFFD32F2F);

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    if (authState is! AuthStateAuthenticated) {
      return const Scaffold(
        backgroundColor: _navy,
        body: Center(
          child: CircularProgressIndicator(color: _gold),
        ),
      );
    }

    final user = authState.user;
    final initials = _initials(user.firstName, user.lastName);
    final fullName = '${user.firstName} ${user.lastName}';
    final isClient = user.role == UserRole.client;

    return Scaffold(
      backgroundColor: _navy,
      appBar: AppBar(
        backgroundColor: _navy,
        elevation: 0,
        title: const Text(
          'Mi Perfil',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        leading: const BackButton(color: Colors.white),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ──────────────────────────────── Header ────────────────────────
            Container(
              width: double.infinity,
              padding:
                  const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
              color: _navyCard,
              child: Column(
                children: [
                  // Avatar
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _gold.withOpacity(0.15),
                      border: Border.all(color: _gold, width: 2),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      initials,
                      style: const TextStyle(
                        color: _gold,
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Name
                  Text(
                    fullName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Email
                  Text(
                    user.email,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Role badge
                  _RoleBadge(role: user.role),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ──────────────────────────────── Menu ──────────────────────────
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // Perfil Médico — clients only
                  if (isClient)
                    _MenuItem(
                      icon: Icons.favorite_border_rounded,
                      label: 'Perfil Médico',
                      subtitle: 'Información de emergencia confidencial',
                      onTap: () => context.push(RouteNames.medical),
                    ),

                  _MenuItem(
                    icon: Icons.receipt_long_outlined,
                    label: 'Historial de Viajes',
                    onTap: () => context.push(RouteNames.tripRequest),
                  ),

                  _MenuItem(
                    icon: Icons.notifications_outlined,
                    label: 'Notificaciones',
                    onTap: () => _showPlaceholder(context, 'Notificaciones'),
                  ),

                  _MenuItem(
                    icon: Icons.lock_outline_rounded,
                    label: 'Privacidad y datos',
                    subtitle: 'Sus datos se gestionan bajo estándares GDPR',
                    onTap: () =>
                        _showPlaceholder(context, 'Privacidad y datos'),
                  ),

                  const SizedBox(height: 8),

                  // Logout
                  _MenuItem(
                    icon: Icons.logout_rounded,
                    label: 'Cerrar sesión',
                    isDestructive: true,
                    onTap: () => _confirmLogout(context, ref),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  String _initials(String first, String last) {
    final f = first.isNotEmpty ? first[0].toUpperCase() : '';
    final l = last.isNotEmpty ? last[0].toUpperCase() : '';
    return '$f$l';
  }

  void _showPlaceholder(BuildContext context, String title) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: _navyCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 16),
            ),
            const SizedBox(height: 12),
            const Text(
              'Esta sección estará disponible próximamente.',
              style: TextStyle(color: Colors.white54, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _navyCard,
        title: const Text(
          'Cerrar sesión',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          '¿Está seguro de que desea cerrar sesión?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: Colors.white54),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text(
              'Cerrar sesión',
              style: TextStyle(color: _red),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

// ---------------------------------------------------------------------------
// Menu item widget
// ---------------------------------------------------------------------------

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.subtitle,
    this.isDestructive = false,
  });

  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final labelColor = isDestructive ? _red : Colors.white;
    final iconColor = isDestructive ? _red : _gold;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: _navyCard,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Icon(icon, color: iconColor, size: 22),
        title: Text(
          label,
          style: TextStyle(
            color: labelColor,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle!,
                style:
                    const TextStyle(color: Colors.white38, fontSize: 12),
              )
            : null,
        trailing: Icon(
          Icons.chevron_right_rounded,
          color: isDestructive ? _red.withOpacity(0.6) : _gold.withOpacity(0.8),
          size: 20,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Role badge widget
// ---------------------------------------------------------------------------

class _RoleBadge extends StatelessWidget {
  const _RoleBadge({required this.role});

  final UserRole role;

  String get _label {
    switch (role) {
      case UserRole.client:
        return 'CLIENTE';
      case UserRole.driver:
        return 'CONDUCTOR';
      case UserRole.supervisor:
        return 'SUPERVISOR';
      case UserRole.superadmin:
        return 'SUPERADMIN';
    }
  }

  Color get _color {
    switch (role) {
      case UserRole.client:
        return const Color(0xFF1565C0);
      case UserRole.driver:
        return const Color(0xFF2E7D32);
      case UserRole.supervisor:
        return const Color(0xFF6A1B9A);
      case UserRole.superadmin:
        return const Color(0xFF7B3F00);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _color, width: 1),
      ),
      child: Text(
        _label,
        style: TextStyle(
          color: _color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.5,
        ),
      ),
    );
  }
}
