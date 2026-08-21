import { type PropsWithChildren, type ReactNode, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadow } from '@/constants/design';
import { useProfiles } from '@/hooks/use-project-data';

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const content = <View style={[styles.screenContent, style]}>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}</SafeAreaView>;
}
export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function Button({ children, onPress, variant = 'primary', loading, disabled, style }: PropsWithChildren<{ onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean; disabled?: boolean; style?: ViewStyle }>) {
  const theme = { primary: styles.primary, secondary: styles.secondary, ghost: styles.ghost, danger: styles.danger }[variant];
  const label = variant === 'primary' || variant === 'danger' ? styles.lightLabel : styles.darkLabel;
  return <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, theme, (disabled || loading) && styles.disabled, pressed && styles.pressed, style]}>{loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? 'white' : colors.forest} /> : <Text style={[styles.buttonLabel, label]}>{children}</Text>}</Pressable>;
}
export function Field({ label, error, style, right, ...props }: TextInputProps & { label: string; error?: string; style?: ViewStyle; right?: ReactNode }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={[styles.inputWrap, error ? styles.inputError : undefined, style]}><TextInput placeholderTextColor="#9AA59E" style={styles.input} {...props} />{right}</View>{error ? <Text style={styles.error}>{error}</Text> : null}</View>; }
export function SectionTitle({ title, action }: { title: string; action?: string }) { return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Text style={styles.sectionAction}>{action}</Text> : null}</View>; }
export function Pill({ children, tone = 'soft', style }: PropsWithChildren<{ tone?: 'soft' | 'green' | 'amber' | 'coral'; style?: ViewStyle }>) { const background = { soft: colors.slate, green: colors.mint, amber: '#FFF0CB', coral: '#FFE1DA' }[tone]; return <View style={[styles.pill, { backgroundColor: background }, style]}><Text style={styles.pillText}>{children}</Text></View>; }
export function EmptyState({ icon = '⌁', title, body, action }: { icon?: string; title: string; body: string; action?: React.ReactNode }) { return <View style={styles.empty}><Text style={styles.emptyIcon}>{icon}</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text>{action}</View>; }
export function LoadingState() { return <View style={styles.loading}><ActivityIndicator size="large" color={colors.forest} /></View>; }
export function Selector({ label, value, options, placeholder = 'Select', onChange, error }: { label: string; value?: string; options: { id: string; name: string }[]; placeholder?: string; onChange: (id: string) => void; error?: string }) {
  const [open, setOpen] = useState(false); const selected = options.find((item) => item.id === value);
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable onPress={() => setOpen(true)} style={[styles.selector, error ? styles.inputError : undefined]}><Text style={selected ? styles.selectorText : styles.placeholder}>{selected?.name ?? placeholder}</Text><Text style={styles.chevron}>▾</Text></Pressable>{error ? <Text style={styles.error}>{error}</Text> : null}
    <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}><Pressable onPress={() => setOpen(false)} style={styles.modalBackdrop}><Pressable style={styles.sheet}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{label}</Text><FlatList data={options} keyExtractor={(item) => item.id} renderItem={({ item }) => <Pressable onPress={() => { onChange(item.id); setOpen(false); }} style={styles.option}><Text style={styles.optionText}>{item.name}</Text>{item.id === value ? <Text style={styles.selected}>✓</Text> : null}</Pressable>} ListEmptyComponent={<Text style={styles.emptyList}>Nothing here yet. Add it from More.</Text>} /></Pressable></Pressable></Modal>
  </View>;
}
export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) { return <View style={styles.header}><View style={styles.headerText}><Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>{subtitle ? <Text numberOfLines={2} style={styles.headerSubtitle}>{subtitle}</Text> : null}</View>{right ? <View style={styles.headerRight}>{right}</View> : null}</View>; }
export function AuditText({ createdBy, updatedBy }: { createdBy?: string; updatedBy?: string }) {
  const profiles = useProfiles([createdBy ?? '', updatedBy ?? '']);
  const createdName = createdBy ? profiles[createdBy]?.displayName : undefined;
  const updatedName = updatedBy ? profiles[updatedBy]?.displayName : undefined;
  if (!createdName && !updatedName) return null;
  const text = createdName && updatedName && createdBy !== updatedBy
    ? `Added by ${createdName} · Edited by ${updatedName}`
    : createdName ? `Added by ${createdName}` : `Last updated by ${updatedName}`;
  return <Text style={styles.audit}>{text}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas }, scroll: { flexGrow: 1 }, screenContent: { flex: 1, padding: 20, gap: 18, width: '100%', maxWidth: 720, alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.line, ...shadow },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: 15 }, primary: { backgroundColor: colors.forest }, secondary: { backgroundColor: colors.mint }, ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line }, danger: { backgroundColor: colors.coral }, disabled: { opacity: .55 }, pressed: { transform: [{ scale: .98 }] }, buttonLabel: { fontSize: 15, fontWeight: '800' }, lightLabel: { color: 'white' }, darkLabel: { color: colors.forest },
  field: { gap: 7 }, label: { color: colors.ink, fontWeight: '700', fontSize: 13 }, inputWrap: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center' }, input: { flex: 1, minHeight: 50, paddingHorizontal: 14, color: colors.ink, fontSize: 16 }, inputError: { borderColor: colors.coral }, error: { color: colors.coral, fontSize: 12 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, sectionTitle: { color: colors.ink, fontWeight: '800', fontSize: 18 }, sectionAction: { color: colors.forest, fontWeight: '800', fontSize: 13 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }, pillText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 38, paddingHorizontal: 24, gap: 9 }, emptyIcon: { fontSize: 35, color: colors.forest }, emptyTitle: { fontSize: 19, fontWeight: '800', color: colors.ink, textAlign: 'center' }, emptyBody: { fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'center', marginBottom: 8 }, loading: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center' },
  selector: { minHeight: 50, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectorText: { fontSize: 16, color: colors.ink }, placeholder: { fontSize: 16, color: '#9AA59E' }, chevron: { fontSize: 18, color: colors.forest },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17, 31, 23, .4)', justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '75%', minHeight: 280 }, sheetHandle: { height: 4, borderRadius: 2, width: 42, backgroundColor: '#CBD4CD', alignSelf: 'center', marginBottom: 16 }, sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 10 }, option: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, optionText: { fontSize: 16, color: colors.ink }, selected: { fontWeight: '900', color: colors.forest, fontSize: 18 }, emptyList: { color: colors.muted, marginTop: 20, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, width: '100%' }, headerText: { flex: 1, flexShrink: 1, minWidth: 0 }, headerRight: { flexShrink: 1, maxWidth: '48%' }, headerTitle: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -.7 }, headerSubtitle: { color: colors.muted, fontSize: 14, marginTop: 3 },
  audit: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 7 },
});
