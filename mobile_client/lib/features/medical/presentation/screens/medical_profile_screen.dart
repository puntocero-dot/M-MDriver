import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/medical_profile_model.dart';
import '../../providers/medical_provider.dart';
import '../widgets/blood_type_selector.dart';

// Design tokens
const Color _gold = Color(0xFFD4AF37);
const Color _navy = Color(0xFF0D1B2A);
const Color _navyCard = Color(0xFF1A2340);
const Color _navyField = Color(0xFF152035);
const Color _red = Color(0xFFD32F2F);
const Color _darkRed = Color(0xFF8B0000);

class MedicalProfileScreen extends ConsumerStatefulWidget {
  const MedicalProfileScreen({super.key});

  @override
  ConsumerState<MedicalProfileScreen> createState() =>
      _MedicalProfileScreenState();
}

class _MedicalProfileScreenState extends ConsumerState<MedicalProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _allergiesCtrl = TextEditingController();
  final _conditionsCtrl = TextEditingController();
  final _medicationsCtrl = TextEditingController();
  final _emergencyInstrCtrl = TextEditingController();
  final _doctorNameCtrl = TextEditingController();
  final _doctorPhoneCtrl = TextEditingController();
  final _insuranceCtrl = TextEditingController();

  String? _selectedBloodType;
  bool _populated = false;

  @override
  void dispose() {
    _allergiesCtrl.dispose();
    _conditionsCtrl.dispose();
    _medicationsCtrl.dispose();
    _emergencyInstrCtrl.dispose();
    _doctorNameCtrl.dispose();
    _doctorPhoneCtrl.dispose();
    _insuranceCtrl.dispose();
    super.dispose();
  }

  void _populate(MedicalProfileModel? profile) {
    if (_populated || profile == null) return;
    _populated = true;
    _selectedBloodType = profile.bloodType;
    _allergiesCtrl.text = profile.allergies ?? '';
    _conditionsCtrl.text = profile.medicalConditions ?? '';
    _medicationsCtrl.text = profile.medications ?? '';
    _emergencyInstrCtrl.text = profile.emergencyInstructions ?? '';
    _doctorNameCtrl.text = profile.doctorName ?? '';
    _doctorPhoneCtrl.text = profile.doctorPhone ?? '';
    _insuranceCtrl.text = profile.insuranceProvider ?? '';
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final dto = MedicalProfileModel(
      bloodType: _selectedBloodType,
      allergies: _allergiesCtrl.text.trim().isEmpty
          ? null
          : _allergiesCtrl.text.trim(),
      medicalConditions: _conditionsCtrl.text.trim().isEmpty
          ? null
          : _conditionsCtrl.text.trim(),
      medications: _medicationsCtrl.text.trim().isEmpty
          ? null
          : _medicationsCtrl.text.trim(),
      emergencyInstructions: _emergencyInstrCtrl.text.trim().isEmpty
          ? null
          : _emergencyInstrCtrl.text.trim(),
      doctorName: _doctorNameCtrl.text.trim().isEmpty
          ? null
          : _doctorNameCtrl.text.trim(),
      doctorPhone: _doctorPhoneCtrl.text.trim().isEmpty
          ? null
          : _doctorPhoneCtrl.text.trim(),
      insuranceProvider: _insuranceCtrl.text.trim().isEmpty
          ? null
          : _insuranceCtrl.text.trim(),
    );

    await ref.read(medicalProvider.notifier).saveProfile(dto);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Perfil médico guardado correctamente.'),
          backgroundColor: Color(0xFF1B4332),
        ),
      );
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _navyCard,
        title: const Text(
          'Eliminar perfil médico',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          '¿Está seguro de que desea eliminar su perfil médico? '
          'Esta acción no se puede deshacer.',
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
              'Eliminar',
              style: TextStyle(color: _red),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await ref.read(medicalProvider.notifier).deleteProfile();
      setState(() {
        _populated = false;
        _selectedBloodType = null;
        _allergiesCtrl.clear();
        _conditionsCtrl.clear();
        _medicationsCtrl.clear();
        _emergencyInstrCtrl.clear();
        _doctorNameCtrl.clear();
        _doctorPhoneCtrl.clear();
        _insuranceCtrl.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final medState = ref.watch(medicalProvider);

    if (medState is MedicalStateLoaded) {
      _populate(medState.profile);
    }

    final isSaving = medState is MedicalStateSaving;
    final isLoading = medState is MedicalStateLoading;

    return Scaffold(
      backgroundColor: _navy,
      appBar: AppBar(
        backgroundColor: _navy,
        elevation: 0,
        leading: const BackButton(color: Colors.white),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Perfil Médico',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            Text(
              'Información de emergencia confidencial',
              style: TextStyle(color: Colors.white54, fontSize: 11),
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(color: _gold),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Warning banner
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: _darkRed.withOpacity(0.25),
                        border: Border.all(
                            color: _red.withOpacity(0.6), width: 1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('⚠️', style: TextStyle(fontSize: 16)),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Esta información solo se comparte con '
                              'supervisores en caso de emergencia SOS',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Blood type
                    BloodTypeSelector(
                      selected: _selectedBloodType,
                      onSelected: (t) =>
                          setState(() => _selectedBloodType = t),
                    ),

                    const SizedBox(height: 20),

                    // Alergias
                    _buildField(
                      label: 'Alergias conocidas',
                      controller: _allergiesCtrl,
                      maxLines: 3,
                      hint: 'Ej: penicilina, látex, mariscos…',
                    ),
                    const SizedBox(height: 16),

                    // Condiciones médicas
                    _buildField(
                      label: 'Condiciones médicas',
                      controller: _conditionsCtrl,
                      maxLines: 3,
                      hint: 'Ej: diabetes tipo 2, hipertensión…',
                    ),
                    const SizedBox(height: 16),

                    // Medicamentos
                    _buildField(
                      label: 'Medicamentos actuales',
                      controller: _medicationsCtrl,
                      maxLines: 3,
                      hint: 'Nombre, dosis y frecuencia…',
                    ),
                    const SizedBox(height: 16),

                    // Instrucciones de emergencia
                    _buildField(
                      label: 'Instrucciones de emergencia',
                      controller: _emergencyInstrCtrl,
                      maxLines: 4,
                      hint:
                          'Qué debe saber el personal de emergencias…',
                    ),
                    const SizedBox(height: 16),

                    // Doctor
                    _buildField(
                      label: 'Doctor de cabecera',
                      controller: _doctorNameCtrl,
                      hint: 'Dr. Nombre Apellido',
                    ),
                    const SizedBox(height: 16),

                    // Doctor phone
                    _buildField(
                      label: 'Teléfono del doctor',
                      controller: _doctorPhoneCtrl,
                      hint: '+503 0000-0000',
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),

                    // Seguro médico
                    _buildField(
                      label: 'Seguro médico',
                      controller: _insuranceCtrl,
                      hint: 'Proveedor y número de póliza',
                    ),

                    const SizedBox(height: 32),

                    // Error message
                    if (medState is MedicalStateError) ...[
                      Text(
                        medState.message,
                        style: const TextStyle(color: _red, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Save button
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: isSaving ? null : _save,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _gold,
                          foregroundColor: _navy,
                          disabledBackgroundColor: _gold.withOpacity(0.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: isSaving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: _navy,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : const Text(
                                'Guardar Perfil Médico',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Delete button (only shown if profile exists)
                    if (medState is MedicalStateLoaded &&
                        medState.profile != null)
                      TextButton(
                        onPressed: isSaving ? null : _confirmDelete,
                        child: const Text(
                          'Eliminar perfil médico',
                          style: TextStyle(
                            color: _red,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    int maxLines = 1,
    String? hint,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
            filled: true,
            fillColor: _navyField,
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF2D4070), width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: _gold, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
