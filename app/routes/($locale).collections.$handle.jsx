import { redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { motion } from 'motion/react';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection.title ?? ''} Collection` }];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return { ...deferredData, ...criticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 100,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{ collection }] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: { handle, ...paginationVariables },
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  const [{ collections }] = await Promise.all([
    storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);  

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  return {
    collection,collections
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({ context }) {
  return {};
}

const links = [
  {
    "name": "shop all",
    "url": "all"
  },
  {
    "name": "puffs",
    "url": "puffs"
  },
  {
    "name": "chips",
    "url": "chips"
  },
  {
    "name": "straws",
    "url": "straws"
  },
  {
    "name": "merch",
    "url": "merch"
  },
]

const ChipsCard = ({ product }) => {
  const variantUrl = useVariantUrl(product.handle);
  return <Link to={variantUrl} className='flex flex-1 flex-col rounded-3xl overflow-hidden relative'>
    <div className='relative cursor-pointer'>
      {product.featuredImage?<Image
        alt={product.featuredImage.altText || product.title}
        className='hover:opacity-0 transition duration-100 ease-in-out absolute top-0 left-0'
        aspectRatio="1/1"
        data={product.featuredImage}
        sizes="(min-width: 45em) 400px, 100vw"
      />:<img className='hover:opacity-0 transition duration-100 ease-in-out absolute top-0 left-0' src="/home/chips2.png" alt="" />}
      <img className='' src="/home/chips1.png" alt="" />
    </div>
    <div className='bg-white p-4'>
      <div className='flex justify-between'>
        <span>{product.title}</span>
        {/* {JSON.stringify(product)} */}
        <span className='text-sm'>{product.priceRange.minVariantPrice.amount}</span>
      </div>
      <div className='flex justify-between'>
        <span className='text-sm text-[#fec800]'>puff variety pack</span>
        <span className='text-sm'>0.8oz bags</span>
      </div>
    </div>
    <div className='absolute top-4 left-4 rounded-3xl bg-white text-[#51282b] p-1 px-3'>18 pack</div>
  </Link>
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const { collection,collections } = useLoaderData();

  return (
    // <div className="collection">
    //   <h1>{collection.title}</h1>
    //   <p className="collection-description">{collection.description}</p>
    //   <PaginatedResourceSection
    //     connection={collection.products}
    //     resourcesClassName="products-grid"
    //   >
    //     {({node: product, index}) => (
    //       <ProductItem
    //         key={product.id}
    //         product={product}
    //         loading={index < 8 ? 'eager' : undefined}
    //       />
    //     )}
    //   </PaginatedResourceSection>
    //   <Analytics.CollectionView
    //     data={{
    //       collection: {
    //         id: collection.id,
    //         handle: collection.handle,
    //       },
    //     }}
    //   />
    // </div>
    <div className="bg-[#fec800] p-4 md:p-14">
      <div className='flex justify-between my-10 md:text-start text-center flex-col md:flex-row'>
        <motion.h4 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ fontFamily: "Motel Xenia" }} className='text-7xl tracking-wide font-bold text-[#51282b]'>{collection.title}</motion.h4>
        <div className='flex flex-wrap gap-4 items-center justify-center text-lg my-5 md:my-0'>
          {collections.nodes.map((link, index) => (
            <Link key={index} to={`/collections/${link.handle}`} className={`rounded-full text-sm md:text-base p-2 px-9 ${link.title === collection.title ? "text-white bg-[#51282b]" : "text-[#51282b] bg-white"}`}>
              {link.title}
            </Link>
          ))}
        </div>
      </div>
      <PaginatedResourceSection
        connection={collection.products}
        resourcesClassName="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-10"
      >
        {({node: product, index}) => (
          <ChipsCard product={product}/>
        )}
      </PaginatedResourceSection>
    </div>
  );
}

/**
 * @param {{
 *   product: ProductItemFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
function ProductItem({ product, loading }) {
  const variantUrl = useVariantUrl(product.handle);
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {product.featuredImage && (
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="1/1"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
