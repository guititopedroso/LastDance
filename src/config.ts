// Contactos e textos da marca, num só sítio.
export const BRAND = {
  name: 'LastDance',
  email: 'geral@lastdance.pt',
  phone: '+351 969 037 376',
  phoneRaw: '351969037376',
  address: 'Avenida da Liberdade, Lisboa',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/',
}

export const whatsapp = (text = 'Olá! Gostava de saber mais sobre os bailes da LastDance.') =>
  `https://wa.me/${BRAND.phoneRaw}?text=${encodeURIComponent(text)}`
