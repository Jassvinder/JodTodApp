import { useRef, useState, type RefObject } from 'react';
import { Modal, TouchableOpacity, View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import type { TodoCategory } from '../types/models';

interface FilterOption {
  key: string;
  label: string;
  color?: string;
}

type FilterName = 'status' | 'priority' | 'category';

interface MenuAnchor {
  x: number;
  y: number;
  width: number;
}

interface TodoFilterBarProps {
  statusOptions: FilterOption[];
  priorityOptions: FilterOption[];
  categories: TodoCategory[];
  status: string;
  priority: string;
  categoryId: number | undefined;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCategoryChange: (value: number | undefined) => void;
}

function FilterControl({ label, active, isOpen, onPress }: { label: string; active: boolean; isOpen: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: active ? Colors.primary : Colors.surface, borderWidth: 1, borderColor: active ? Colors.primary : Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
    >
      <Text style={{ fontSize: 12, fontWeight: '500', color: active ? '#fff' : Colors.text }} numberOfLines={1}>{label}</Text>
      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color={active ? '#fff' : Colors.textMuted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

export default function TodoFilterBar({ statusOptions, priorityOptions, categories, status, priority, categoryId, onStatusChange, onPriorityChange, onCategoryChange }: TodoFilterBarProps) {
  const statusRef = useRef<View>(null);
  const priorityRef = useRef<View>(null);
  const categoryRef = useRef<View>(null);
  const [openFilter, setOpenFilter] = useState<FilterName | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const categoryOptions: FilterOption[] = [{ key: 'all', label: 'All Categories' }, ...categories.map((category) => ({ key: String(category.id), label: category.name, color: category.color }))];
  const categoryLabel = categoryId ? categories.find((category) => category.id === categoryId)?.name || 'Category' : 'All Categories';

  const closeMenu = () => {
    setOpenFilter(null);
    setMenuAnchor(null);
  };

  const openMenu = (filter: FilterName, ref: RefObject<View | null>) => {
    if (openFilter === filter) {
      closeMenu();
      return;
    }

    ref.current?.measureInWindow((x, y, width) => {
      setMenuAnchor({ x, y, width });
      setOpenFilter(filter);
    });
  };

  const options = openFilter === 'status' ? statusOptions : openFilter === 'priority' ? priorityOptions : categoryOptions;
  const selected = openFilter === 'status' ? status : openFilter === 'priority' ? priority : categoryId ? String(categoryId) : 'all';

  const selectOption = (value: string) => {
    if (openFilter === 'status') onStatusChange(value);
    if (openFilter === 'priority') onPriorityChange(value);
    if (openFilter === 'category') onCategoryChange(value === 'all' ? undefined : Number(value));
    closeMenu();
  };

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <View ref={statusRef} style={{ flex: 1 }}>
          <FilterControl label={statusOptions.find((option) => option.key === status)?.label || 'All Status'} active={status !== 'all'} isOpen={openFilter === 'status'} onPress={() => openMenu('status', statusRef)} />
        </View>
        <View ref={priorityRef} style={{ flex: 1 }}>
          <FilterControl label={priorityOptions.find((option) => option.key === priority)?.label || 'All Priority'} active={priority !== 'all'} isOpen={openFilter === 'priority'} onPress={() => openMenu('priority', priorityRef)} />
        </View>
        {categories.length > 0 && (
          <View ref={categoryRef} style={{ flex: 1 }}>
            <FilterControl label={categoryLabel} active={!!categoryId} isOpen={openFilter === 'category'} onPress={() => openMenu('category', categoryRef)} />
          </View>
        )}
      </View>

      <Modal visible={openFilter !== null && menuAnchor !== null} transparent animationType="none" onRequestClose={closeMenu}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity activeOpacity={1} onPress={closeMenu} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
          {menuAnchor && (
            <View style={{
              position: 'absolute', top: menuAnchor.y + 46, left: menuAnchor.x, width: menuAnchor.width,
              backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
              overflow: 'hidden', elevation: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6,
            }}>
              {options.map((option) => {
                const isSelected = selected === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => selectOption(option.key)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: isSelected ? '#eef2ff' : Colors.surface }}
                  >
                    {option.color && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: option.color, marginRight: 6 }} />}
                    <Text style={{ flex: 1, fontSize: 12, color: isSelected ? Colors.primary : Colors.text, fontWeight: isSelected ? '600' : '400' }}>{option.label}</Text>
                    {isSelected && <Ionicons name="checkmark" size={14} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
