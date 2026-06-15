import ShopClient from './ShopClient'

export function generateStaticParams() {
  return [
    { shop: 'demo' },
    { shop: 'test-shop' },
    { shop: 'baguette-express' },
    { shop: 'lao-bun-house' },
  ]
}

export default function Page({ params }: { params: { shop: string } }) {
  return <ShopClient shop={params.shop} />
}
