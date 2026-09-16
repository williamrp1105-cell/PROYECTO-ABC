SISTEMA ABC - V36

V36 mantiene la interfaz de la versión anterior y reorganiza el apartado Flujo de Caja.

Cambios:
- Antes del flujo se ingresan los ingresos y costos de operación por cada mes.
- Los datos mensuales del flujo son independientes de los presupuestos anteriores.
- Se agregan parámetros generales: inversión inicial, IVA, IT e IUE.
- Se incorpora una tabla de costo financiero a partir de préstamo, tasa y plazo.
- La tabla financiera calcula saldo inicial, interés, amortización de capital, cuota y saldo final.
- Se incorpora una tabla para agregar, editar y eliminar activos depreciables.
- La depreciación de cada activo se calcula como (costo inicial - valor residual) / vida útil.
- Se incorpora activo diferido con cálculo automático de amortización por periodo.
- El flujo de caja se genera posteriormente usando exclusivamente los datos capturados en este apartado y los cálculos derivados.
- Se conserva la compatibilidad básica con datos de V35.

Instalación: copiar la carpeta del proyecto dentro de C:\xampp\htdocs y abrir index.php mediante Apache.

V37 - Cálculo del VAN
- Se añadió el apartado 8. Cálculo del VAN dentro de Flujo de Caja.
- El usuario ingresa la tasa de descuento/interés r en porcentaje.
- I0 corresponde a la inversión inicial registrada en Flujo de Caja.
- Ft corresponde al Flujo de Caja de cada periodo (mes) calculado en el apartado 6.
- Fórmula aplicada: VAN = -I0 + SUMA(Ft / (1+r)^t), con r expresada como tasa decimal.
- Se muestra el flujo de caja de cada periodo, su valor presente y el VAN total.
- La tasa de descuento queda guardada junto con los demás datos del flujo de caja.
