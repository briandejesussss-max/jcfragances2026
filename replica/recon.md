# Recon: Perfumes Robols (funcionamiento) y Silloria (diseño)

Objetivo: mejorar **JS FRAGANCES** tomando ideas de funcionamiento, no clonar.
Solo se revisaron páginas públicas, a velocidad humana. No se copió código, fotos ni textos.

## Fuentes

| fuente | url | resultado |
| --- | --- | --- |
| Robols inicio | https://perfumesrobols.com/ | revisado (escritorio y celular) |
| Robols ficha | https://perfumesrobols.com/products/vibrato-sospiro | revisado |
| Robols decants | https://perfumesrobols.com/collections/decants | revisado (filtros y orden) |
| Robols cuestionario | https://perfumesrobols.com/pages/encuentra-tu-perfume | recorrido completo |
| Silloria | https://www.silloria.com/en | **bloqueado**: "Vercel Security Checkpoint" a visitantes automáticos. No se forzó. |

## Pantallas (Robols)

| ID | pantalla | cómo se llega | componentes clave |
| --- | --- | --- | --- |
| S01 | Inicio | / | barra roja de promo, buscador grande, botón "Encuentra tu perfume", menú (Descuentos, Nicho, Decants, Caballero, Dama, Lo más nuevo, Lo más vendido, Marcas, Aromas, Testimonios, Guías, Ayuda), carrusel, franja "+900 testimonios · +5,500 envíos", Lo más vendido, Vistos recientemente, Nuevas llegadas, "Pruébalo antes de comprar el frasco" (decants), testimonios, Compra por marca |
| S02 | Colección | /collections/decants | filtros (disponibilidad, precio, familia), orden (relevancia, más vendidos, A-Z, precio, fecha), contador "271 productos", tarjetas con 3 precios de decant |
| S03 | Ficha | /products/… | galería, marca + estrellas, precio con tachado y "Ahorras", "En existencia · recibe en 1–3 días", selector botella/decant como tarjetas, "¿Qué es un decant?", envío y umbral, Agregar / Comprar ahora, pagos, **Cómo huele**, familias, pirámide narrada, notas principales "+5", **Ideal para**, sellos (DHL, 100% original, compra protegida, regalo), "Arma tu set de decants", reseñas |
| S04 | Ficha celular | igual | **barra fija abajo** con miniatura, tamaño, precio y "Agregar al carrito" |
| S05 | Cuestionario intro | /pages/encuentra-tu-perfume | 3 pasos explicados + "Empezar" + prueba social |
| S06 | Cuestionario preguntas | botón Empezar | pantalla completa, "Pregunta N de 6", barra de progreso por segmentos, ← y ✕, opciones grandes con subtítulo |
| S07 | Cuestionario resultados | última respuesta | "Estos 3 son para ti", "89 cumplen lo que pediste", chips con las respuestas, "Cambiar respuestas", Tu mejor opción (con "Por qué te lo recomendamos"), Opción 2 y 3, Ver 3 más, Empezar de nuevo |

## Flujo estrella: F01 Encontrar perfume con el cuestionario

S05 → S06 ×6 → S07 → ficha o agregar directo. **8 toques** hasta el resultado.

1. ¿Qué estilo buscas? Más masculino / Más femenino / Unisex o me da igual (solo ordena)
2. ¿Qué tipo de aroma te gusta? hasta 2 de 10 familias (con colores) o "Sorpréndeme"
3. ¿Para qué lo quieres? De día / De noche / Para todo / Para una cita
4. ¿Con qué clima? Con calor / Con frío / Todo el año
5. ¿Cómo lo quieres? Botella / Decant / Los dos
6. ¿Cuándo lo necesitas? Lo quiero ya / Puedo esperar (incluye preventas)

Resultado: filtra el catálogo con esas respuestas y ordena por más vendidos; explica el porqué con las familias, la ocasión y el clima de cada perfume.

**Encaja perfecto con JS FRAGANCES**: tus perfumes ya tienen género, notas, clima y ocasión guardados, así que no hace falta capturar nada nuevo.

## Modelo de datos inferido (Robols)

- Perfume: marca, nombre, concentración, familias (varias), notas por etapa, ideal para (momento, temporada, lugar), precio botella, precio anterior, decants 3/5/10 ml, existencia o preventa. *Confianza alta* (todo visible en S03).
- Reseña: estrellas, texto, nombre corto, "compra verificada". *Alta*.
- Cuestionario: respuestas → filtros sobre los campos del perfume. *Media* (inferido del resultado).

## Fuera de alcance

Su inventario, fotos, textos y marca. Pagos con tarjeta/MSI requieren tu propia cuenta (Mercado Pago o Stripe). El diseño de Silloria no se pudo ver.

## Tamaño

Las mejoras "must" (cuestionario, barra fija en la ficha, umbral de envío gratis): **M**, unos días. Lo más difícil: el cuestionario (reglas de recomendación), pagos en línea (cuenta externa) y páginas por familia (orden y conteos).
