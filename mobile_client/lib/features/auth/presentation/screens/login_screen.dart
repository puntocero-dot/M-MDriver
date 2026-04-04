import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/router/route_names.dart';
import '../widgets/auth_text_field.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  late AnimationController _fadeAnim;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideIn;

  @override
  void initState() {
    super.initState();
    _fadeAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
    _fadeIn = CurvedAnimation(parent: _fadeAnim, curve: Curves.easeOut);
    _slideIn = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _fadeAnim, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fadeAnim.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      await ref.read(authProvider.notifier).login(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = 'Credenciales inválidas. Intente de nuevo.');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Stack(
          children: [
            // ── Ambient gradient blobs ──────────────────────────────────
            Positioned(
              top: -100,
              right: -80,
              child: Container(
                width: 320,
                height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.gold.withOpacity(0.08),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -80,
              left: -60,
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.tertiary.withOpacity(0.06),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ── Scrollable content ──────────────────────────────────────
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: FadeTransition(
                    opacity: _fadeIn,
                    child: SlideTransition(
                      position: _slideIn,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(height: size.height * 0.08),

                          // ── Logo ──────────────────────────────────────
                          Column(
                            children: [
                              ShaderMask(
                                shaderCallback: (bounds) =>
                                    const LinearGradient(
                                  begin: Alignment(-0.7, -0.7),
                                  end: Alignment(0.7, 0.7),
                                  colors: [
                                    Color(0xFFF2CA50),
                                    Color(0xFFD4AF37),
                                  ],
                                ).createShader(bounds),
                                child: Text(
                                  'M&M',
                                  style: GoogleFonts.manrope(
                                    fontSize: 52,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white, // masked by shader
                                    letterSpacing: 1,
                                  ),
                                ),
                              ),
                              Text(
                                'DRIVER',
                                style: GoogleFonts.manrope(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.secondary,
                                  letterSpacing: 6,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          Text(
                            'Su conductor personal, en su propio vehículo',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: AppColors.outline,
                              letterSpacing: 0.2,
                            ),
                          ),

                          SizedBox(height: size.height * 0.06),

                          // ── Glass Form Card ───────────────────────────
                          ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(
                                  sigmaX: 20, sigmaY: 20),
                              child: Container(
                                padding: const EdgeInsets.all(28),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF353534)
                                      .withOpacity(0.55),
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(
                                    color: AppColors.outlineVariant
                                        .withOpacity(0.3),
                                    width: 0.5,
                                  ),
                                ),
                                child: Form(
                                  key: _formKey,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Heading
                                      Text(
                                        'Iniciar Sesión',
                                        style: GoogleFonts.manrope(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.onSurface,
                                          letterSpacing: -0.2,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Accede a tu cuenta corporativa',
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          color: AppColors.outline,
                                        ),
                                      ),
                                      const SizedBox(height: 24),

                                      // Email
                                      AuthTextField(
                                        controller: _emailController,
                                        label: 'Correo / ID Corporativo',
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        prefixIcon: Icons.person_outline,
                                        validator: (v) {
                                          if (v == null || v.isEmpty) {
                                            return 'Ingrese su correo';
                                          }
                                          if (!v.contains('@')) {
                                            return 'Correo inválido';
                                          }
                                          return null;
                                        },
                                      ),
                                      const SizedBox(height: 14),

                                      // Password
                                      AuthTextField(
                                        controller: _passwordController,
                                        label: 'Contraseña',
                                        obscureText: true,
                                        prefixIcon: Icons.lock_outline,
                                        validator: (v) {
                                          if (v == null || v.length < 8) {
                                            return 'Mínimo 8 caracteres';
                                          }
                                          return null;
                                        },
                                      ),

                                      // Forgot password
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: TextButton(
                                          onPressed: () {},
                                          style: TextButton.styleFrom(
                                            padding: EdgeInsets.zero,
                                            minimumSize: Size.zero,
                                            tapTargetSize:
                                                MaterialTapTargetSize
                                                    .shrinkWrap,
                                          ),
                                          child: Text(
                                            '¿Olvidó su contraseña?',
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              color: AppColors.gold,
                                            ),
                                          ),
                                        ),
                                      ),

                                      // Error banner
                                      if (_errorMessage != null) ...[
                                        const SizedBox(height: 12),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 14, vertical: 10),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF93000A)
                                                .withOpacity(0.3),
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            border: Border.all(
                                              color: AppColors.error
                                                  .withOpacity(0.4),
                                              width: 0.5,
                                            ),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.error_outline,
                                                color: AppColors.error,
                                                size: 16,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  _errorMessage!,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    color: AppColors.error,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],

                                      const SizedBox(height: 24),

                                      // ── CTA — Gold gradient ───────────
                                      _GoldCTA(
                                        label: 'Ingresar',
                                        isLoading: _isLoading,
                                        onTap: _isLoading ? null : _login,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 20),

                          // ── Register link ─────────────────────────────
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '¿No tienes cuenta?  ',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: AppColors.outline,
                                ),
                              ),
                              GestureDetector(
                                onTap: () => context.go(RouteNames.register),
                                child: Text(
                                  'Crear cuenta',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.gold,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          // ── Encrypted session indicator ───────────────
                          const SizedBox(height: 28),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.verified_user_outlined,
                                size: 14,
                                color: AppColors.outline,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Sesión Cifrada',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: AppColors.outline,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gold gradient CTA
// ─────────────────────────────────────────────────────────────────────────────

class _GoldCTA extends StatelessWidget {
  const _GoldCTA({
    required this.label,
    required this.isLoading,
    required this.onTap,
  });
  final String label;
  final bool isLoading;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        gradient: onTap == null
            ? null
            : const LinearGradient(
                begin: Alignment(-0.7, -0.7),
                end: Alignment(0.7, 0.7),
                colors: [Color(0xFFF2CA50), Color(0xFFD4AF37)],
              ),
        color: onTap == null ? AppColors.surfaceContainerHigh : null,
        borderRadius: BorderRadius.circular(16),
        boxShadow: onTap == null
            ? null
            : [
                BoxShadow(
                  color: const Color(0xFFF2CA50).withOpacity(0.25),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Center(
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(0xFF3C2F00),
                    ),
                  )
                : Text(
                    label.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: onTap == null
                          ? AppColors.outline
                          : const Color(0xFF3C2F00),
                      letterSpacing: 0.8,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
