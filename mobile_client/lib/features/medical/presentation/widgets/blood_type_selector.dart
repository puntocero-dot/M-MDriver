import 'package:flutter/material.dart';

const List<String> kBloodTypes = [
  'A+',
  'A-',
  'B+',
  'B-',
  'O+',
  'O-',
  'AB+',
  'AB-',
];

/// Horizontally scrollable row of blood-type chips.
///
/// [selected] — currently selected blood type (may be null).
/// [onSelected] — callback with the tapped blood type string.
class BloodTypeSelector extends StatelessWidget {
  const BloodTypeSelector({
    super.key,
    required this.selected,
    required this.onSelected,
  });

  final String? selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tipo de sangre',
          style: TextStyle(
            color: Colors.white70,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 42,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: kBloodTypes.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final type = kBloodTypes[index];
              final isSelected = type == selected;
              return _BloodTypeChip(
                label: type,
                isSelected: isSelected,
                onTap: () => onSelected(type),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _BloodTypeChip extends StatelessWidget {
  const _BloodTypeChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  // Design tokens
  static const Color _gold = Color(0xFFD4AF37);
  static const Color _navy = Color(0xFF1A2340);
  static const Color _navyLight = Color(0xFF243055);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 52,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? _gold : _navyLight,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? _gold : const Color(0xFF3A4D7A),
            width: 1.5,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? _navy : Colors.grey[400],
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
