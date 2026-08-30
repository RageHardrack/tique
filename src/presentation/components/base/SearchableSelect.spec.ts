import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SearchableSelect from './SearchableSelect.vue';

describe('SearchableSelect Component', () => {
  const items = [
    { label: 'Sin categoría / General', value: '' },
    { label: 'Alimentación y Restaurantes', value: 'cat-1', color: '#10B981' },
    { label: 'Transporte y Movilidad', value: 'cat-2', color: '#3B82F6' },
    { label: 'Vivienda y Servicios', value: 'cat-3', color: '#F59E0B' },
  ];

  it('renders trigger button with placeholder when no value is selected', () => {
    const wrapper = mount(SearchableSelect, {
      props: {
        items,
        placeholder: 'Seleccionar categoría...',
        modelValue: '',
      },
    });

    expect(wrapper.text()).toContain('Sin categoría / General');
  });

  it('renders selected item label and color dot when modelValue is provided', () => {
    const wrapper = mount(SearchableSelect, {
      props: {
        items,
        modelValue: 'cat-1',
      },
    });

    expect(wrapper.text()).toContain('Alimentación y Restaurantes');
  });

  it('toggles dropdown and filters items based on search query', async () => {
    const wrapper = mount(SearchableSelect, {
      props: {
        items,
        modelValue: '',
      },
    });

    // Open menu
    await wrapper.find('button[type="button"]').trigger('click');
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);

    // Filter by query "transporte"
    const input = wrapper.find('input[type="text"]');
    await input.setValue('transporte');

    const options = wrapper.findAll('.max-h-56 button');
    expect(options).toHaveLength(1);
    expect(options[0].text()).toContain('Transporte y Movilidad');

    // Select the filtered option
    await options[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['cat-2']);
  });
});
