import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DateRangeSelector from './DateRangeSelector.vue';

describe('DateRangeSelector.vue - Preset Selection & Custom Range UX', () => {
  it('should render all preset buttons with min 44px ergonomics', () => {
    const wrapper = mount(DateRangeSelector, {
      props: {
        modelValue: 'MONTHLY',
      },
    });

    const buttons = wrapper.findAll('button[type="button"]');
    expect(buttons.length).toBe(6); // Monthly, Bi-monthly, Quarterly, Semi-annual, Full-year, Custom

    expect(wrapper.text()).toContain('Este Mes');
    expect(wrapper.text()).toContain('Bimestral');
    expect(wrapper.text()).toContain('Trimestral');
    expect(wrapper.text()).toContain('Semestral');
    expect(wrapper.text()).toContain('Año Completo');
    expect(wrapper.text()).toContain('Personalizado');
  });

  it('should emit "update:modelValue" and "change" when clicking a preset', async () => {
    const wrapper = mount(DateRangeSelector, {
      props: {
        modelValue: 'MONTHLY',
      },
    });

    const quarterlyBtn = wrapper.findAll('button').find((b) => b.text().includes('Trimestral'));
    expect(quarterlyBtn).toBeDefined();

    await quarterlyBtn!.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['QUARTERLY']);
    expect(wrapper.emitted('change')?.[0][0]).toMatchObject({
      preset: 'QUARTERLY',
      label: 'Trimestral (Cuarto de Año)',
    });
  });

  it('should reveal custom date inputs when preset is CUSTOM', async () => {
    const wrapper = mount(DateRangeSelector, {
      props: {
        modelValue: 'CUSTOM',
        customStartDate: '2026-06-01',
        customEndDate: '2026-08-25',
      },
    });

    expect(wrapper.find('#custom-start-date').exists()).toBe(true);
    expect(wrapper.find('#custom-end-date').exists()).toBe(true);
  });
});
