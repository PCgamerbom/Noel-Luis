import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Menu,
  Radio,
  X,
} from 'lucide-react';
import {
  getGetRobloxCommunitiesQueryKey,
  getGetRobloxPresenceQueryKey,
  getGetRobloxProductsQueryKey,
  getGetRobloxProfilesQueryKey,
  useGetRobloxCommunities,
  useGetRobloxPresence,
  useGetRobloxProducts,
  useGetRobloxProfiles,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import type {
  RobloxCommunity,
  RobloxPresence,
  RobloxProduct,
  RobloxProfile,
} from '@workspace/api-client-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

type StoreFilter = 'all' | 'noel' | 'lusobr';

function usePortfolioData() {
  const presence = useGetRobloxPresence({
    query: {
      queryKey: getGetRobloxPresenceQueryKey(),
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  });
  const profiles = useGetRobloxProfiles({
    query: { queryKey: getGetRobloxProfilesQueryKey(), staleTime: 5 * 60_000 },
  });
  const communities = useGetRobloxCommunities({
    query: { queryKey: getGetRobloxCommunitiesQueryKey(), staleTime: 5 * 60_000 },
  });
  const products = useGetRobloxProducts({
    query: { queryKey: getGetRobloxProductsQueryKey(), staleTime: 2 * 60_000 },
  });
  return { presence, profiles, communities, products };
}

function formatPresence(entry: RobloxPresence | undefined, loading: boolean, failed: boolean) {
  if (loading) return 'Checking status';
  if (failed || !entry || entry.status === 'unavailable') return 'Unable to load status';
  if (entry.status === 'online') return 'Online - Not Playing';
  if (entry.status === 'in_game') return entry.experienceName ? `In Game — ${displayText(entry.experienceName)}` : 'In Game';
  if (entry.status === 'in_studio') return 'In Studio';
  return 'Offline';
}

function displayText(value: string) {
  return value
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0E\uFE0F\u200D\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function ExternalLink({
  href,
  children,
  className,
  testId,
  label,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  testId: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noreferrer"
      data-testid={testId}
      aria-label={label}
    >
      {children}
    </a>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

function LoadingCards({ count = 2 }: { count?: number }) {
  return (
    <div className={count === 2 ? 'profile-grid' : 'community-grid'} aria-label="Loading content">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton skeleton-card" key={index} />
      ))}
    </div>
  );
}

function QueryState({
  loading,
  failed,
  empty,
  retry,
  emptyText,
  children,
  testId,
}: {
  loading: boolean;
  failed: boolean;
  empty: boolean;
  retry: () => void;
  emptyText: string;
  children: ReactNode;
  testId: string;
}) {
  if (loading) return <LoadingCards />;
  if (failed) {
    return (
      <div className="state-box" data-testid={`${testId}-unavailable`}>
        <Radio size={16} aria-hidden="true" />
        <span>Unable to load this information right now.</span>
        <button className="error-action" onClick={retry} data-testid={`button-retry-${testId}`}>
          Try again
        </button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="state-box" data-testid={`${testId}-empty`}>
        <span>{emptyText}</span>
      </div>
    );
  }
  return <>{children}</>;
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ['Home', '#home'],
    ['Profiles', '#profiles'],
    ['Communities', '#communities'],
    ['Contact', '#contact'],
  ];
  return (
    <header className="site-header">
      <div className="page-width nav-inner">
        <a href="#home" className="brand" data-testid="link-home" aria-label="Noel home">
          <span className="brand-mark">
            <img src="/logo.png" className="brand-logo-small" alt="" />
          </span>
          <span>Noel <span style={{ color: 'var(--gold)', fontWeight: 300 }}>/ Creator</span></span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <a key={href} href={href} data-testid={`nav-${label.toLowerCase()}`} className={label === 'Contact' ? 'nav-contact' : ''}>
              {label}{label === 'Contact' && <ArrowUpRight size={13} aria-hidden="true" />}
            </a>
          ))}
        </nav>
        <button
          className="mobile-menu"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          data-testid="button-mobile-menu"
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} data-testid={`mobile-nav-${label.toLowerCase()}`}>
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

function ProfileCard({
  profile,
  presence,
  presenceLoading,
  presenceFailed,
}: {
  profile: RobloxProfile;
  presence?: RobloxPresence;
  presenceLoading: boolean;
  presenceFailed: boolean;
}) {
  const status = formatPresence(presence, presenceLoading, presenceFailed);
  const displayName = displayText(profile.displayName);
  const username = displayText(profile.username);
  const description = displayText(profile.description);
  const createdLabel = profile.created
    ? new Date(profile.created).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : '';
  return (
    <article className="profile-card" data-testid={`card-profile-${profile.userId}`}>
      {profile.avatarUrl ? (
        <img className="profile-avatar" src={profile.avatarUrl} alt={`${displayName} Roblox avatar`} data-testid={`img-avatar-${profile.userId}`} />
      ) : (
        <div className="profile-avatar" aria-label={`${displayName} avatar unavailable`} data-testid={`img-avatar-${profile.userId}`} />
      )}
      <div className="profile-info">
        <h3 className="profile-name" data-testid={`text-display-name-${profile.userId}`}>{displayName}</h3>
        <div className="profile-handle" data-testid={`text-username-${profile.userId}`}>@{username}</div>
        <div className="profile-handle" data-testid={`text-user-id-${profile.userId}`}>User ID {profile.userId}</div>
        <div className="presence" data-testid={`status-presence-${profile.userId}`}>
          <span className={`presence-dot ${presence?.status ?? (presenceFailed ? 'unavailable' : '')}`} aria-hidden="true" />
          <span>{status}</span>
        </div>
        {description && <p className="profile-description">{description}</p>}
        {createdLabel && <span className="profile-handle">On Roblox since {createdLabel}</span>}
        <ExternalLink href={profile.profileUrl} className="text-link" testId={`link-profile-${profile.userId}`} label={`Visit ${username}'s Roblox profile`}>
          View Roblox profile <ArrowUpRight size={13} aria-hidden="true" />
        </ExternalLink>
      </div>
    </article>
  );
}

function CommunityCard({ community }: { community: RobloxCommunity }) {
  const name = displayText(community.name);
  const description = displayText(community.description);
  return (
    <article className="community-card" data-testid={`card-community-${community.communityId}`}>
      <div className="community-top">
        {community.iconUrl ? (
          <img className="community-icon" src={community.iconUrl} alt={`${name} community icon`} data-testid={`img-community-${community.communityId}`} />
        ) : (
          <div className="community-icon" aria-label={`${name} icon unavailable`} data-testid={`img-community-${community.communityId}`} />
        )}
        <div>
          <h3 className="community-name" data-testid={`text-community-name-${community.communityId}`}>{name}</h3>
          <div className="member-count" data-testid={`text-community-members-${community.communityId}`}>
            {new Intl.NumberFormat().format(community.memberCount)} members
          </div>
        </div>
      </div>
      {description && <p className="community-description">{description}</p>}
      <div className="community-actions">
        <ExternalLink href={community.communityUrl} className="text-link" testId={`link-community-visit-${community.communityId}`} label={`Visit ${name} on Roblox`}>
          Visit community <ArrowUpRight size={13} aria-hidden="true" />
        </ExternalLink>
        <ExternalLink href={community.storeUrl} className="text-link" testId={`link-community-store-${community.communityId}`} label={`Shop ${name} items`}>
          View store <ArrowRight size={13} aria-hidden="true" />
        </ExternalLink>
      </div>
    </article>
  );
}

function ProductCard({ product }: { product: RobloxProduct }) {
  const name = displayText(product.name);
  const communityName = displayText(product.communityName);
  return (
    <article className="product-card" data-testid={`card-product-${product.productId}`}>
      <div className="product-image-wrap">
        {product.imageUrl ? (
          <img className="product-image" src={product.imageUrl} alt={name} loading="lazy" data-testid={`img-product-${product.productId}`} />
        ) : (
          <div className="product-image" aria-label={`${name} image unavailable`} data-testid={`img-product-${product.productId}`} />
        )}
      </div>
      <div className="product-details">
        <div className="product-owner" data-testid={`text-product-owner-${product.productId}`}>{communityName}</div>
        <div className="product-name" data-testid={`text-product-name-${product.productId}`}>{name}</div>
        <div className="product-bottom">
          <div className="product-price" data-testid={`text-product-price-${product.productId}`}>
            {product.price == null ? 'Price unavailable' : <><strong>{new Intl.NumberFormat().format(product.price)}</strong> Robux</>}
          </div>
          <ExternalLink href={product.productUrl} className="product-buy" testId={`link-product-${product.productId}`} label={`View ${name} on Roblox`}>
            <ArrowUpRight size={15} aria-hidden="true" />
          </ExternalLink>
        </div>
      </div>
    </article>
  );
}

function Home() {
  const [filter, setFilter] = useState<StoreFilter>('all');
  const { presence, profiles, communities, products } = usePortfolioData();
  const profilesList = profiles.data?.items ?? [];
  const presenceList = presence.data?.items ?? [];
  const communitiesList = communities.data?.items ?? [];
  const productsList = products.data?.items ?? [];
  const filteredProducts = productsList.filter((product) => {
    if (filter === 'noel') return product.communityName.toLowerCase().includes('noel ugc');
    if (filter === 'lusobr') return product.communityName.toLowerCase().includes('lusobr studio');
    return true;
  });
  const productFilters: { value: StoreFilter; label: string }[] = [
    { value: 'all', label: 'All Items' },
    { value: 'noel', label: 'NOEL UGC' },
    { value: 'lusobr', label: 'LusoBR Studio' },
  ];

  return (
    <div className="portfolio-shell">
      <Header />
      <main>
        <section className="page-width hero" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <SectionEyebrow>Roblox creator portfolio</SectionEyebrow>
            <h1 id="hero-title">Welcome.</h1>
            <p className="hero-description">
              Roblox communities, creations and experiences.
            </p>
            <p className="hero-introduction">
              I’m Noel — a Roblox creator shaping experiences, communities, and pieces worth taking with you.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#profiles" data-testid="button-explore-profiles">
                Explore profiles <ArrowDown size={14} aria-hidden="true" />
              </a>
              <a className="button-outline" href="#communities" data-testid="button-view-communities">
                The communities
              </a>
            </div>
          </div>
          <div className="hero-aside">
            <div className="hero-art" aria-label="Logo de Noel">
              <div className="art-ring" />
              <div className="art-core">
                <img src="/logo.png" className="art-logo" alt="Logo de Noel" />
              </div>
              <div className="art-caption">Roblox / Creator / Portfolio</div>
            </div>
            <aside className="hero-community-links" aria-label="Roblox community links">
              <span className="hero-community-label">Communities</span>
              {communitiesList.map((community) => (
                <a
                  key={community.communityId}
                  href={community.communityUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-testid={`link-hero-community-${community.communityId}`}
                >
                  {displayText(community.name)} <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              ))}
            </aside>
          </div>
          <div className="hero-index"><span>01</span><span>—</span><span>Independent creator</span></div>
        </section>

        <section className="section" id="profiles" aria-labelledby="profiles-title">
          <div className="page-width">
            <div className="section-heading">
              <div>
                <SectionEyebrow>Across the platform</SectionEyebrow>
                <h2 className="section-title" id="profiles-title">Roblox profiles</h2>
              </div>
              <p className="section-intro">Two sides of the same creative practice. Find the right profile and see what’s happening right now.</p>
            </div>
            <QueryState
              loading={profiles.isLoading}
              failed={profiles.isError}
              empty={profiles.isSuccess && profilesList.length === 0}
              retry={() => void profiles.refetch()}
              emptyText="No Roblox profiles are available at the moment."
              testId="profiles"
            >
              <div className="profile-grid">
                {profilesList.map((profile) => (
                  <ProfileCard
                    key={profile.userId}
                    profile={profile}
                    presence={presenceList.find((item) => item.userId === profile.userId)}
                    presenceLoading={presence.isLoading}
                    presenceFailed={presence.isError}
                  />
                ))}
              </div>
            </QueryState>
          </div>
        </section>

        <section className="section" id="communities" aria-labelledby="communities-title">
          <div className="page-width">
            <div className="section-heading">
              <div>
                <SectionEyebrow>Made together</SectionEyebrow>
                <h2 className="section-title" id="communities-title">Communities</h2>
              </div>
              <p className="section-intro">The groups behind the work. Join the conversation or head straight to each community’s catalog.</p>
            </div>
            <QueryState
              loading={communities.isLoading}
              failed={communities.isError}
              empty={communities.isSuccess && communitiesList.length === 0}
              retry={() => void communities.refetch()}
              emptyText="No Roblox communities are available at the moment."
              testId="communities"
            >
              <div className="community-grid">
                {communitiesList.map((community) => <CommunityCard key={community.communityId} community={community} />)}
              </div>
            </QueryState>
          </div>
        </section>

        <section className="section" id="items" aria-labelledby="items-title">
          <div className="page-width">
            <div className="section-heading">
              <div>
                <SectionEyebrow>From the catalog</SectionEyebrow>
                <h2 className="section-title" id="items-title">Featured items</h2>
              </div>
              <p className="section-intro">A selection of catalog pieces from the creator communities. Every item opens at its Roblox source.</p>
            </div>
            <div className="store-toolbar">
              <div className="filter-group" role="group" aria-label="Filter featured items">
                {productFilters.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    className={`filter-button${filter === item.value ? ' active' : ''}`}
                    aria-pressed={filter === item.value}
                    onClick={() => setFilter(item.value)}
                    data-testid={`filter-${item.value}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {products.data?.updatedAt && <span className="updated-label" data-testid="text-catalog-updated">Catalog refreshed {new Date(products.data.updatedAt).toLocaleDateString()}</span>}
            </div>
            {!products.isLoading && !products.isError && products.data?.available === false ? (
              <div className="state-box" data-testid="products-unavailable"><Radio size={16} aria-hidden="true" /> Catalog items are currently unavailable.</div>
            ) : products.isLoading ? (
              <div className="product-grid" aria-label="Loading catalog items">
                {Array.from({ length: 4 }, (_, index) => <div className="skeleton skeleton-card" key={index} />)}
              </div>
            ) : products.isError ? (
              <div className="state-box" data-testid="products-unavailable">
                <Radio size={16} aria-hidden="true" /><span>Unable to load catalog items right now.</span>
                <button className="error-action" onClick={() => void products.refetch()} data-testid="button-retry-products">Try again</button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="state-box" data-testid="products-empty">
                {productsList.length === 0 ? 'No featured items are currently available.' : 'No items are currently available for this community.'}
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => <ProductCard key={product.productId} product={product} />)}
              </div>
            )}
          </div>
        </section>

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="page-width">
            <div className="contact-panel">
              <div>
                <SectionEyebrow>Keep in touch</SectionEyebrow>
                <h2 className="contact-title" id="contact-title">See you in the worlds.</h2>
                <p className="contact-copy">Connect through the Roblox communities and profiles above.</p>
              </div>
              {profilesList[0] && (
                <ExternalLink href={profilesList[0].profileUrl} className="contact-mail" testId="link-contact-roblox" label={`Connect with Noel on Roblox as ${profilesList[0].username}`}>
                  Find me on Roblox <ArrowUpRight size={15} aria-hidden="true" />
                </ExternalLink>
              )}
            </div>
            <footer className="footer-bottom">
              <span className="footer-brand">NOEL <span style={{ color: 'var(--gold)' }}>·</span> ROBLOX CREATOR</span>
              <span>Independent work, built for the platform.</span>
              <a href="#home" data-testid="link-back-to-top">Back to top ↑</a>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
