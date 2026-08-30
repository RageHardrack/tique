# Guía de Arquitectura Tributaria SUNAT (Perú) — Rentas de 4ta & 5ta Categoría

Esta guía detalla el funcionamiento del sistema tributario peruano para **Rentas del Trabajo** (personas naturales independientes y en planilla), la lógica del motor tributario implementado en **Tique**, y la distinción entre las proyecciones de la aplicación y las obligaciones reales que debes declarar ante la **SUNAT**.

---

## 1. Visión General: Tique vs. SUNAT

| Aspecto | ¿Qué hace Tique? | ¿Qué debes hacer ante la SUNAT? |
| :--- | :--- | :--- |
| **Naturaleza** | Herramienta de **gestión y proyección financiera** en tiempo real. | Plataforma oficial de **recaudación y fiscalización tributaria**. |
| **Ámbito Legal** | Simulador y estimador financiero preventivo (sin validez fiscal). | Declaraciones juradas y pagos vinculantes con fuerza de ley. |
| **Emisión de Comprobantes** | Registra montos de RxH emitidos y comprobantes de gasto para control. | Emisión obligatoria en **SUNAT Operaciones en Línea (SOL)** o App SUNAT. |
| **Gastos Deducibles (3 UIT)** | Registra y clasifica gastos del día a día asignando los % de deducción. | SUNAT valida comprobantes electrónicos emitidos con tu **DNI o RUC**. |
| **Declaraciones Mensuales** | Proyecta retenciones acumuladas y pagos a cuenta estimados. | Presentación de **Declara Fácil 616** (si no tienes suspensión de 4ta). |
| **Declaración Anual (DJ Anual)** | Proyecta el impuesto final, saldo por pagar o saldo a favor (devolución). | Presentación oficial del **Formulario Virtual 709** (entre marzo y abril). |

---

## 2. Marco Normativo de las Rentas de Trabajo

Bajo la **Ley del Impuesto a la Renta de Perú (Decreto Legislativo N° 774)** y sus modificaciones:

### 2.1 Unidad Impositiva Tributaria (UIT)
La **UIT** es el valor de referencia tributario fijado anualmente por el Ministerio de Economía y Finanzas (MEF).
- **Año 2026**: S/ 5,350 (configurable dinámicamente en el perfil tributario de Tique).

```text
Renta Bruta de 4ta Categoría (Total RxH emitidos en el año)
(-) Deducción legal del 20% (con tope máximo de 24 UIT)
(=) Renta Neta de 4ta Categoría

(+) Renta Bruta de 5ta Categoría (Total percibido en planilla: sueldos, gratificaciones, etc.)
(=) Total Renta de Trabajo
(-) Deducción fija de 7 UIT (Inafectación legal base)
(-) Gastos Deducibles Adicionales de hasta 3 UIT (Restaurantes, Hoteles, Alquileres, etc.)
(=) Renta Neta Imponible de Trabajo (Base sobre la que se aplica la escala de tasas)
```

---

## 3. Clasificación de Rentas del Trabajo

### 3.1 Cuarta Categoría (Trabajadores Independientes)
- **Concepto**: Ingresos generados por el ejercicio individual de cualquier profesión, arte, ciencia, oficio o actividades no incluidas expresamente en la tercera categoría.
- **Comprobante Obligatorio**: **Recibo por Honorarios Electrónico (RxH)**.
- **Deducción Fija del 20%**: El Estado peruano permite deducir automáticamente el 20% de los ingresos brutos de 4ta categoría por concepto de gastos presuntos, hasta un tope máximo de **24 UIT**.

#### Retención en la Fuente del 8%
- Cuando emites un RxH a una empresa o persona jurídica obligada a llevar contabilidad por un monto **superior a S/ 1,500**, el pagador te retendrá el **8%**.
- **Suspensión de Retenciones (Formulario Virtual 1609)**: Si proyectas que tus ingresos anuales por 4ta (o 4ta + 5ta) no superarán el límite legal anual fijado por SUNAT (aprox. S/ 45,000 anuales), puedes tramitar la constancia de suspensión en SOL. Con ello, las empresas no te retendrán el 8% sin importar el monto del recibo.

### 3.2 Quinta Categoría (Trabajadores Dependientes en Planilla)
- **Concepto**: Ingresos percibidos por trabajo en relación de dependencia (sueldos, comisiones, gratificaciones legales, horas extras, bonificaciones).
- **Tratamiento**: No admiten deducción del 20%. El empleador calcula y retiene mensualmente el impuesto estimado mediante la planilla electrónica (**PLAME**).

---

## 4. Deducciones Adicionales: Las 3 UIT de Gastos Deducibles

Para incentivar la formalización, SUNAT permite a las personas naturales deducir **hasta un máximo de 3 UIT** adicionales sumando gastos específicos debidamente sustentados:

| Categoría de Gasto | % Deducible | Requisitos Formales de SUNAT | Registro en Tique |
| :--- | :---: | :--- | :--- |
| **Restaurantes, Bares y Cafeterías** | **15%** | Boleta de venta electrónica con tu **DNI** registrado. El local debe tener CIIU activo de restaurante y emitir electrónicamente. | Gasto categorizado como `RESTAURANT_BAR` con flag deducible activo. |
| **Hoteles y Alojamientos** | **15%** | Boleta electrónica con **DNI**. Establecimiento formal de hospedaje. | Gasto categorizado como `HOTEL`. |
| **Arrendamiento de Inmuebles** | **30%** | Formulario 1683 (pago del 5% del arrendador) o Factura Electrónica si es persona jurídica. | Gasto categorizado como `RENTAL`. |
| **Servicios de Cuarta Categoría (Médicos, Abogados, Gasfiteros, etc.)** | **30%** | Recibo por Honorarios Electrónico (RxH) emitido a tu **DNI**. Medio de pago bancarizado si el monto supera S/ 2,000 o US$ 500. | Gasto categorizado como `PROFESSIONAL_SERVICE`. |
| **Aportes a Trabajadores del Hogar** | **100%** | Formulario 1676 (pago mensual de Essalud / 9%). | Gasto categorizado como `DOMESTIC_WORKER`. |

> [!IMPORTANT]
> **Tope Legal**: Por más que la sumatoria supere las 3 UIT, la deducción total máxima aplicable a la renta bruta no puede exceder el equivalente a **3 UIT** (para UIT S/ 5,350, el tope es S/ 16,050).

---

## 5. Escala Progresiva Acumulativa del Impuesto a la Renta

Una vez obtenida la **Renta Neta Imponible**, se calculan los tramos escalonados:

| Tramo | Rango en UIT | Rango en Soles (UIT = S/ 5,350) | Tasa Aplicable |
| :---: | :---: | :---: | :---: |
| **1** | Hasta 5 UIT | Hasta S/ 26,750.00 | **8%** |
| **2** | Más de 5 UIT hasta 20 UIT | De S/ 26,750.01 hasta S/ 107,000.00 | **14%** |
| **3** | Más de 20 UIT hasta 35 UIT | De S/ 107,000.01 hasta S/ 187,250.00 | **17%** |
| **4** | Más de 35 UIT hasta 45 UIT | De S/ 187,250.01 hasta S/ 240,750.00 | **20%** |
| **5** | Más de 45 UIT | Por el exceso de S/ 240,750.00 | **30%** |

```text
Impuesto Calculado Total = Suma(Impuesto de cada tramo)
(-) Retenciones acumuladas de 4ta categoría (8% de RxH)
(-) Retenciones acumuladas de 5ta categoría (Planilla)
(=) Resultado Final:
    - Si es positivo (> 0)  -> Saldo por Pagar a SUNAT (Regularización en DJ Anual)
    - Si es negativo (< 0) -> Saldo a Favor del Contribuyente (Devolución SUNAT)
```

---

## 6. Caso Práctico Numérico (Paso a Paso)

Supongamos el ejercicio anual 2026 con UIT = S/ 5,350:

### Datos del Contribuyente:
- **Ingresos por RxH (4ta categoría)**: S/ 80,000.00
  - Retenciones del 8% sufridas: S/ 6,400.00
- **Ingresos por Planilla (5ta categoría)**: S/ 40,000.00
  - Retenciones de 5ta efectuadas por la empresa: S/ 1,200.00
- **Gastos registrados con Boleta/DNI**:
  - Restaurantes (S/ 10,000): 15% = S/ 1,500.00
  - Alquiler departamento (S/ 20,000): 30% = S/ 6,000.00
  - Total deducción 3 UIT: S/ 7,500.00 (menor al tope de S/ 16,050).

### Desarrollo del Cálculo:
1. **Renta Neta 4ta**: S/ 80,000 - 20% (S/ 16,000) = **S/ 64,000.00**
2. **Renta 5ta**: **S/ 40,000.00**
3. **Total Renta de Trabajo**: S/ 64,000 + S/ 40,000 = **S/ 104,000.00**
4. **Deducción 7 UIT**: 7 × S/ 5,350 = **S/ 37,450.00**
5. **Deducción 3 UIT**: **S/ 7,500.00**
6. **Renta Neta Imponible**: S/ 104,000 - S/ 37,450 - S/ 7,500 = **S/ 59,050.00**

### Aplicación de Escala:
- **Tramo 1 (8% hasta S/ 26,750)**: S/ 26,750 × 8% = **S/ 2,140.00**
- **Tramo 2 (14% sobre exceso de S/ 26,750 hasta S/ 59,050)**: (S/ 59,050 - S/ 26,750) × 14% = S/ 32,300 × 14% = **S/ 4,522.00**
- **Impuesto Total Determinado**: S/ 2,140.00 + S/ 4,522.00 = **S/ 6,662.00**

### Liquidación Final:
- Impuesto Determinado: S/ 6,662.00
- (-) Retenciones 4ta (RxH): S/ 6,400.00
- (-) Retenciones 5ta: S/ 1,200.00
- **Total Pagos a Cuenta/Retenciones**: S/ 7,600.00
- **Resultado**: S/ 6,662.00 - S/ 7,600.00 = **-S/ 938.00** (Saldo a Favor de Devolución 🎉).

---

## 7. Procedimiento Operativo para Declarar ante la SUNAT

### Durante el Año (Operación Mensual)
1. **Emisión de RxH**: Emitir cada recibo en SOL indicando si retiene o no el 8%.
2. **Exigencia de Comprobantes**: Al acudir a restaurantes o pagar alquileres, pedir boleta electrónica consignando obligatoriamente tu **DNI**.
3. **Consulta de Gastos Deducibles**: Ingresar periódicamente a SOL -> *Mis Deducciones 3 UIT* para comprobar que los comercios reportaron los comprobantes.

### Al Cierre del Año (Marzo/Abril del año siguiente)
1. SUNAT publica el **Archivo Personalizado** en el **Formulario Virtual 709** (Renta Anual Personas Naturales).
2. Verificar los ingresos de 4ta y 5ta prellenados por SUNAT contra tus registros en Tique.
3. Validar los gastos de 3 UIT reconocidos. Si falta algún gasto de alquiler o RxH de médico, puedes agregarlo manualmente en el formulario virtual.
4. Presentar la **Declaración Jurada Anual**.
5. Si el saldo es a favor: solicitar devolución automática seleccionando tu código de cuenta interbancario (**CCI**) o pedir compensación para el siguiente ejercicio.
