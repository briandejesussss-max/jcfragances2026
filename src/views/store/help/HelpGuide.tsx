import Link from 'next/link';
import type { ReactNode } from 'react';
import { SHIPPING } from '@/config/store';
import { cn } from '@/lib/utils/cn';
import { whatsappLink } from '@/lib/utils/whatsapp';
import type { StoreConfig } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import styles from './HelpGuide.module.css';

/** Guía para clientes: cómo comprar, presentaciones, cuenta, seguimiento y preguntas frecuentes. */

const TOC = [
  ['comprar', 'Cómo comprar'],
  ['formatos', 'Presentaciones'],
  ['cuenta', 'Crear tu cuenta'],
  ['pedidos', 'Seguir tu pedido'],
  ['anteriores', 'Pedidos anteriores'],
  ['extras', 'Más funciones'],
  ['preguntas', 'Preguntas'],
] as const;

const UI = ({ children }: { children: ReactNode }) => (
  <span className="inline-block whitespace-nowrap rounded-md border border-cork bg-umber px-2 text-[0.85em] text-cream">{children}</span>
);

function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow?: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="mt-8 grid scroll-mt-24 gap-4 border-t border-dashed border-cork pt-10">
      {eyebrow && <p className="text-[11px] uppercase tracking-[0.14em] text-sand">{eyebrow}</p>}
      <h2 id={`h-${id}`} className="text-[clamp(1.5rem,5vw,2rem)]">
        {title}
      </h2>
      {intro && <p className="max-w-[62ch] text-sand">{intro}</p>}
      {children}
    </section>
  );
}

function Steps({ items }: { items: Array<{ title: string; body: ReactNode }> }) {
  return (
    <ol className={styles.steps}>
      {items.map((s) => (
        <li key={s.title} className="rounded-[20px] border border-cork bg-umber p-4">
          <div>
            <h3 className="mb-1 text-base leading-tight">{s.title}</h3>
            <div className="space-y-1.5 text-[0.95rem] text-sand">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Tip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 rounded-[20px] border border-cork bg-umber p-4">
      <h3 className="text-base leading-tight">{title}</h3>
      <p className="text-[0.95rem] text-sand">{children}</p>
    </div>
  );
}

const Note = ({ children }: { children: ReactNode }) => <div className="rounded-2xl border border-dashed border-cork px-4 py-3.5 text-[0.95rem] text-sand">{children}</div>;

const SIZES = [
  { label: '3 ml', price: '$180', note: 'Decant' },
  { label: 'Botella', price: '$3,500', note: 'De línea' },
  { label: 'Tester', price: '$2,300', note: 'Botella tester' },
  { label: 'Botella', price: '$4,000', note: 'Bajo pedido · 2 semanas', order: true },
  { label: '10 ml', price: 'Agotado', note: 'No disponible', off: true },
];

const STAGES: Array<{ label: string; detail: string; state: 'done' | 'now' | 'next'; onDemand?: boolean }> = [
  { label: 'Pedido registrado', detail: '18 nov · Esperando tu transferencia', state: 'done' },
  { label: 'Pagado', detail: '18 nov · Recibimos tu pago', state: 'done' },
  { label: 'Pedido con el proveedor', detail: '19 nov · “Ya lo pedimos”', state: 'done', onDemand: true },
  { label: 'En camino a México', detail: '21 nov · “Llega en 5 días”', state: 'now', onDemand: true },
  { label: 'Recibido en México', detail: 'Pendiente', state: 'next', onDemand: true },
  { label: 'Enviado', detail: 'Aquí aparecen la paquetería y tu número de guía', state: 'next' },
  { label: 'Entregado', detail: 'Pendiente', state: 'next' },
];

const FAQ: Array<[string, ReactNode]> = [
  ['¿Es obligatorio crear una cuenta?', 'No. Puedes comprar y rastrear tu pedido sin cuenta. La cuenta solo te ahorra buscar tu número de pedido y llenar tus datos cada vez.'],
  ['Olvidé mi contraseña, ¿qué hago?', 'En la pantalla de entrar toca “¿Olvidaste tu contraseña? Escríbenos por WhatsApp” y te ayudamos a recuperar tu cuenta.'],
  ['¿Alguien más puede ver mis pedidos?', 'No. Cada cuenta solo ve sus propios pedidos, y nadie puede modificarlos desde una cuenta de cliente.'],
  [
    '¿Cuánto cuesta el envío?',
    `El envío general es de $${SHIPPING.base} a toda la república. Si tu zona es extendida, te escribimos por WhatsApp con el costo final antes de que pagues.`,
  ],
  ['¿Cuánto tarda un producto bajo pedido?', 'Cada producto bajo pedido indica su tiempo estimado en el botón (por ejemplo “2 semanas”). Te avisamos en cada etapa y la ves en tu cuenta.'],
  [
    'No encuentro mi pedido para agregarlo',
    'Revisa que el número y el correo sean exactamente los de esa compra. Si lo hiciste con otro correo o dice que ya está en otra cuenta, escríbenos por WhatsApp.',
  ],
];

export function HelpGuide({ config }: { config: StoreConfig }) {
  const igUrl = config.instagramUrl || `https://www.instagram.com/${config.instagram.replace(/^@/, '')}`;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div className="grid gap-4 pb-6 pt-11">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sand">Guía para clientes</p>
        <h1 className="text-[clamp(2.2rem,8vw,3.4rem)]">
          Así funciona <span className="text-ember">tu tienda de decants</span>
        </h1>
        <p className="max-w-[60ch] text-[1.05rem] text-sand">
          Elige tu perfume, pídelo en 3, 5 o 10 ml o en botella completa, y sigue tu pedido hasta tu puerta. Aquí te explicamos cada paso, incluida tu cuenta para ver tus envíos.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1.5">
          <Link href="/#catalogo" className={buttonClass('cream', 'lg')}>
            Ver catálogo
          </Link>
          <Link href="/cuenta/registro" className={buttonClass('ghost', 'lg')}>
            Crear mi cuenta
          </Link>
        </div>
      </div>

      <nav aria-label="Contenido de la guía" className="flex flex-wrap gap-2 pb-3 pt-2">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-pill border border-cork px-3.5 py-2 text-xs uppercase tracking-[0.04em] text-sand hover:border-sand hover:text-cream">
            {label}
          </a>
        ))}
      </nav>

      <Section id="comprar" eyebrow="Paso a paso" title="Cómo comprar" intro="No necesitas cuenta para comprar. Si la creas, tu pedido queda guardado en tu perfil y tu dirección se llena sola la próxima vez.">
        <Steps
          items={[
            { title: 'Encuentra tu perfume', body: 'En el catálogo busca por nombre, casa o nota (por ejemplo “vainilla” u “oud”). Puedes filtrar por casa y por categoría y ordenar por lo más nuevo o por nombre.' },
            { title: 'Abre su ficha', body: 'Toca la foto o el nombre. Verás la pirámide olfativa (salida, corazón y fondo), la duración, la estela, el clima y la ocasión ideal, y todas las presentaciones con su precio.' },
            { title: 'Agrégalo a tu bolsa', body: <>Toca la presentación que quieras. Puedes sumar varias fragancias y cambiar cantidades en <UI>Bolsa</UI>, arriba a la derecha.</> },
            {
              title: 'Escribe tus datos de entrega',
              body: (
                <>
                  <p>
                    En la bolsa toca <UI>Continuar con mi pedido</UI> y llena nombre, teléfono, correo y dirección. Al escribir tu código postal se llenan el estado y la lista de colonias.
                  </p>
                  <p>Guarda bien el correo: con él podrás rastrear tu pedido.</p>
                </>
              ),
            },
            {
              title: 'Confirma y paga por transferencia',
              body: (
                <>
                  Toca <UI>Confirmar pedido</UI>. Te mostramos tu número de pedido (por ejemplo JS-1012) y los datos para transferir. El envío general es de ${SHIPPING.base}; si tu código postal es zona extendida, te escribimos por WhatsApp con el monto final antes de que pagues.
                </>
              ),
            },
            { title: 'Manda tu comprobante', body: <>Toca <UI>Enviar comprobante por WhatsApp</UI>. Confirmamos tu pago y te avisamos cuando tu pedido salga, con su número de guía.</> },
          ]}
        />
      </Section>

      <Section id="formatos" eyebrow="Qué significa cada botón" title="Presentaciones y disponibilidad">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2" aria-label="Ejemplos de presentaciones">
          {SIZES.map((s) => (
            <div
              key={s.note}
              className={cn('grid gap-0.5 rounded-[14px] border p-2.5 text-center', s.order ? 'border-ember/70 bg-ember/10' : 'border-cork', s.off && 'opacity-40')}
            >
              <span className="text-xs text-sand">{s.label}</span>
              <b className="font-medium">{s.price}</b>
              <span className="text-xs text-sand">{s.note}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-sand">Precios de ejemplo. Los reales están en cada ficha.</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
          <Tip title="Decants">Atomizadores de vidrio de 3, 5 o 10 ml rellenados del frasco original. Ideales para probar antes de comprar la botella.</Tip>
          <Tip title="Botella completa y tester">El frasco completo. “Tester” es la versión sin caja de presentación; el perfume es el mismo.</Tip>
          <Tip title="Bajo pedido">
            Lo traemos especialmente para ti. El botón indica el tiempo estimado. Tu pedido pasa por etapas extra (con proveedor, en camino a México, recibido) que puedes seguir en tu cuenta.
          </Tip>
          <Tip title="Agotado o próximamente">Si dice Agotado o “Sin ml”, ya no hay existencias de esa presentación. En los perfumes “Próximamente” toca “Avísame cuando llegue” y te escribimos.</Tip>
        </div>
      </Section>

      <Section id="cuenta" eyebrow="Opcional y gratis" title="Crea tu cuenta" intro="Con tu cuenta ves todos tus pedidos y en qué etapa va cada uno, sin tener que buscarlos.">
        <Steps
          items={[
            {
              title: 'Toca el ícono de persona',
              body: (
                <>
                  Está arriba, junto a la bolsa. Luego toca <UI>Crear cuenta</UI>, o entra directo a{' '}
                  <Link href="/cuenta/registro" className="text-cream underline underline-offset-4">
                    Crear mi cuenta
                  </Link>
                  .
                </>
              ),
            },
            { title: 'Escribe tus datos', body: 'Tu nombre, tu correo y una contraseña de al menos 8 caracteres. Usa el mismo correo con el que compras.' },
            { title: 'Listo, ya estás dentro', body: <>Entras de inmediato, sin esperar ningún correo. La próxima vez entra con <UI>Entrar</UI> usando tu correo y contraseña.</> },
          ]}
        />
        <Note>
          <b className="font-medium text-cream">¿Acabas de comprar sin cuenta?</b> En la pantalla del pago aparece <UI>Crea tu cuenta</UI>. Si la creas desde ahí, tu número de pedido ya viene escrito para agregarlo a tu perfil.
        </Note>
      </Section>

      <Section
        id="pedidos"
        eyebrow="Mi cuenta"
        title="Sigue tu pedido"
        intro={
          <>
            En <UI>Mi cuenta</UI> ves tus pedidos con una barra de avance. Toca <UI>Ver detalle</UI> para ver cada etapa con su fecha y las notas que te dejamos.
          </>
        }
      >
        <div role="img" aria-label="Ejemplo de seguimiento de un pedido bajo pedido que va en camino a México" className="rounded-[20px] border border-cork bg-umber px-4 pb-1 pt-4">
          {STAGES.map((s) => (
            <div key={s.label} className={styles.stage}>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'size-3.5 shrink-0 rounded-full border-2',
                    s.state === 'done' && 'border-ember bg-ember',
                    s.state === 'now' && 'border-ember bg-walnut',
                    s.state === 'next' && 'border-cork',
                  )}
                />
                <span className={cn(styles.rail, s.state === 'done' ? 'bg-ember' : 'bg-cork')} />
              </div>
              <div className="pb-3.5">
                <b className={cn('block font-medium', s.state === 'now' && 'text-ember', s.state === 'next' && 'text-sand')}>
                  {s.label}
                  {s.onDemand && <span className="ml-1.5 rounded-pill border border-cork px-2 align-[2px] text-[10px] uppercase tracking-[0.06em] text-sand">bajo pedido</span>}
                </b>
                <span className="text-sm text-sand">{s.detail}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="max-w-[62ch] text-sand">
          Los pedidos de productos en existencia solo tienen cuatro etapas: registrado, pagado, enviado y entregado. Cuando se envíe, en el detalle aparece el botón <UI>Rastrear paquete</UI> de la paquetería.
        </p>
        <Note>
          <b className="font-medium text-cream">¿Sin cuenta?</b> También puedes rastrear en{' '}
          <Link href="/rastreo" className="text-cream underline underline-offset-4">
            Rastrear pedido
          </Link>{' '}
          con tu número de pedido y el correo con el que compraste.
        </Note>
      </Section>

      <Section id="anteriores" eyebrow="Si ya habías comprado" title="Agrega tus pedidos anteriores" intro="Lo que compres con tu sesión iniciada aparece solo. Para un pedido que hiciste antes de tener cuenta:">
        <Steps
          items={[
            { title: 'Entra a Mi cuenta', body: <>Baja hasta <UI>¿Compraste antes sin cuenta?</UI></> },
            { title: 'Escribe el número y el correo', body: 'El número de pedido (JS-…) y el correo con el que hiciste esa compra.' },
            { title: 'Toca Agregar pedido', body: 'Aparece en tu lista con todo su avance. Por seguridad, un pedido solo puede estar en una cuenta.' },
          ]}
        />
      </Section>

      <Section id="extras" eyebrow="Para aprovecharla mejor" title="Más funciones">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
          <Tip title="Tus favoritos">Toca el corazón en cualquier perfume para guardarlo. Aparecen en “Combina con tu armario” al inicio de la tienda.</Tip>
          <Tip title="Mis datos">En Mi cuenta → Mis datos guarda tu teléfono y dirección; se llenan solos en tu siguiente compra.</Tip>
          <Tip title="Comparte o descarga una ficha">En la ficha de cada perfume puedes descargarla como imagen o compartir su link con alguien.</Tip>
          <Tip title="Colores y moneda">Con el ícono de paleta cambias los colores de la página (negro, azul medianoche, blanco, grafito o café). En el menú puedes ver precios en dólares.</Tip>
        </div>
      </Section>

      <Section id="preguntas" eyebrow="Dudas comunes" title="Preguntas frecuentes">
        <div className="grid gap-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-cork bg-umber px-4">
              <summary className="flex cursor-pointer list-none justify-between gap-3 py-3.5 font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-ember group-open:hidden" aria-hidden="true">
                  +
                </span>
                <span className="hidden text-ember group-open:inline" aria-hidden="true">
                  –
                </span>
              </summary>
              <p className="pb-3.5 text-[0.95rem] text-sand">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section id="contacto" title="¿Necesitas ayuda?">
        <div className="grid gap-3 rounded-3xl border border-cork bg-umber p-5">
          <p className="text-sand">Escríbenos y con gusto te asesoramos para elegir tu próxima fragancia.</p>
          <div className="flex flex-wrap items-center gap-2.5">
            <a href={whatsappLink(config.whatsapp, 'Hola, tengo una pregunta sobre la tienda.')} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'md')}>
              WhatsApp
            </a>
            <span className="select-all">{config.whatsapp}</span>
          </div>
          {config.instagram && (
            <div className="flex flex-wrap items-center gap-2.5">
              <a href={igUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('ghost', 'md')}>
                Instagram
              </a>
              <span className="select-all">{config.instagram}</span>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
