# JS FRAGANCES — Tienda de decants (Next.js + Supabase)

Tienda en línea de decants y botellas con panel de administración. Next.js 16 (App Router), Tailwind CSS 4 y Supabase (Postgres, Auth y Storage), desplegada en Vercel.

## Arquitectura MVC

```
src/
├── models/                 M — datos y reglas de negocio
│   ├── types.ts            Tipos del dominio (Fragrance, Order, StoreConfig…)
│   ├── domain/             Lógica pura, sin I/O (se usa en servidor y navegador)
│   │   ├── sizes.ts        Presentaciones, disponibilidad, existencias, descuento de inventario
│   │   ├── orders.ts       Armado y validación de pedidos, etapas, mensajes al cliente
│   │   ├── catalog.ts      Filtros y orden del catálogo
│   │   ├── pyramid.ts      Pirámide olfativa (emojis y fotos por nota)
│   │   ├── profile.ts      Radiografía olfativa
│   │   ├── finance.ts      Totales del panel de finanzas
│   │   ├── calculators.ts  Calculadoras de importación y de costo de decants
│   │   └── address.ts      Estados y búsqueda de código postal
│   └── repositories/       Acceso a Supabase, una por tabla
├── controllers/            C — orquestan modelos, validan y revalidan caché
│   ├── catalog.controller.ts      Lecturas públicas cacheadas (etiqueta `catalog`)
│   ├── checkout.controller.ts     Server Actions: crear pedido (total recalculado) y rastreo
│   ├── auth.controller.ts         Login / logout del propietario
│   ├── fragrance.controller.ts    Alta, edición, borrado y precios de fragancias
│   ├── inventory.controller.ts    Existencias
│   ├── order-admin.controller.ts  Etapas, envío y descuentos de pedidos
│   ├── store-config.controller.ts Datos de la tienda
│   ├── finance.controller.ts      Movimientos y reserva de impuestos
│   └── admin-data.controller.ts   Cargadores del panel (sin caché, con sesión)
├── views/                  V — componentes React agrupados por vista
│   ├── shared/             Botones, campos, modal, avisos, imagen
│   ├── store/              Tienda: layout, home, catalog, product, cart, tracking, state
│   └── admin/              Panel: auth, fragrances, inventory, orders, store, finance, calculators
├── app/                    Rutas (delgadas: conectan controlador → vista)
│   ├── (store)/            /, /perfume/[slug], /rastreo
│   ├── admin/              /admin/login y (panel)/…
│   └── api/codigo-postal/  Consulta de C.P. cacheada en la CDN
├── lib/                    Supabase (clientes y proxy), sesión, utilidades
└── proxy.ts                Refresca la sesión y protege /admin
```

Los estilos viven junto a su vista: clases de Tailwind en cada componente y un `*.module.css` por vista cuando hace falta CSS propio (`FragranceCard.module.css`, `ProductView.module.css`, `Hero.module.css`…). `app/globals.css` solo define los tokens de diseño (paleta "Madera cálida") y estilos base.

## Supabase

| Cliente | Archivo | Uso |
| --- | --- | --- |
| Público (sin cookies) | `lib/supabase/server.ts` → `createSupabasePublicClient` | Catálogo cacheado y RPC públicas (`create_order`, `track_order`) |
| Servidor con sesión | `lib/supabase/server.ts` → `createSupabaseServerClient` | Panel: Server Components y Server Actions |
| Navegador | `lib/supabase/client.ts` | Subir fotos a Storage desde el panel |
| Proxy | `lib/supabase/proxy.ts` | Refresca el token y redirige al login |

- El catálogo se sirve estático (ISR, 10 min) y el panel lo invalida con `updateTag('catalog')` al guardar.
- Los pedidos se validan en el servidor: precios, existencias, envío y total se recalculan con los datos de la base.
- Las fotos se suben al bucket `fotos` y solo se guarda su URL (ya no imágenes en base64 dentro de la base de datos).
- `supabase/migrations/` contiene cambios de seguridad propuestos: **revísalos antes de aplicarlos**.

## Variables de entorno

Copia `.env.example` a `.env.local`. En Vercel van en *Production* y *Preview*.

| Variable | Pública | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí | Clave publicable (`sb_publishable_…`); la seguridad la dan las políticas RLS |
| `NEXT_PUBLIC_SITE_URL` | Sí | URL pública (sitemap, metadatos) |

No se necesita la clave `service_role`.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

## Despliegue

- `dev`: rama de trabajo. Los pushes **no** despliegan (vistas previas desactivadas en Vercel).
- `main`: producción. Cada push a `main` despliega en https://jcfragances2026.vercel.app.

El sitio anterior (HTML estático) quedó en `legacy/` como referencia; no se publica.
