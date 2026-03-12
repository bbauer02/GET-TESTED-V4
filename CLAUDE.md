# CLAUDE.md - Directives Architecturales du Projet

## A garder en mémoire scrupuleusement : 

- Code Source du template MINIMALS.CC dans ce dossier ! Mais ne modifie rien dedans, lis seulement , il te sert de reference, de guide. : `C:\Users\baptiste\Documents\Dev\Getskills\Minimal_JavaScript_v7.6.1\next-js`

- Code source de l'API : `C:\Users\baptiste\Documents\Dev\Getskills\API-GETTESTED-V4`

- Code SOurce du projet : `C:\Users\baptiste\Documents\Dev\Getskills\GETTESTED-V4`


## Projet

- **Template**: Minimal UI Kit v7.6.1 (JavaScript)
- **Framework**: Next.js 16+ (App Router)
- **UI Library**: MUI (Material UI) v7.3.6 avec @mui/lab, @mui/x-data-grid v8, @mui/x-date-pickers v8, @mui/x-tree-view v8
- **Langage**: JavaScript (JSX) - PAS de TypeScript
- **Package Manager**: Yarn 1.22.22
- **Node**: >= 22.12.0
- **Port dev**: 3032

## Commandes

```bash
yarn dev          # Lancer en dev (port 3032)
yarn build        # Build production
yarn lint         # ESLint
yarn lint:fix     # Fix ESLint
yarn fm:fix       # Prettier fix
yarn fix:all      # Lint + Prettier fix
```

---

## SKILL 1 : Conventions de Nommage et Structure des Fichiers

### Nommage des fichiers
- **Tous les fichiers** utilisent le `kebab-case` : `user-table-row.jsx`, `checkout-provider.jsx`
- **Composants** : `.jsx` (jamais `.js` sauf hooks/utils purs)
- **Hooks** : prefixe `use-` : `use-table.js`, `use-collapse-nav.js`
- **Utilitaires** : `.js` : `process-data.js`, `helpers.js`
- **Styles** : `styles.jsx` (styled components MUI)
- **Classes CSS** : `classes.js` (constantes de noms de classes via `createClasses`)
- **Barrel exports** : `index.js` avec `export * from './component-name'`
- **Contextes** : `[nom]-context.js`, `[nom]-provider.jsx`, `use-[nom]-context.js`

### Structure des sections (`src/sections/`)
Chaque section suit un pattern adapte a sa complexite :

**Section simple** (1 vue) :
```
section/
└── view.jsx
```

**Section standard** (vue + composants) :
```
section/
├── view/
│   ├── index.js              # Barrel export
│   └── section-view.jsx      # Vue principale
├── section-component-a.jsx   # Composants prefixes par le nom de section
└── section-component-b.jsx
```

**Section CRUD** (vues multiples) :
```
section/
├── view/
│   ├── index.js
│   ├── section-list-view.jsx
│   ├── section-create-view.jsx
│   ├── section-edit-view.jsx
│   └── section-details-view.jsx
├── section-table-row.jsx
├── section-table-toolbar.jsx
├── section-table-filters-result.jsx
└── section-create-edit-form.jsx
```

**Section complexe** (hooks, utils, sous-dossiers) :
```
section/
├── view/
│   ├── index.js
│   └── section-view.jsx
├── column/                    # Sous-feature
│   ├── section-column.jsx
│   └── styles.jsx
├── hooks/
│   └── use-feature-logic.js
├── utils/
│   └── helpers.js
├── components/
│   └── section-skeleton.jsx
├── styles.jsx
└── classes.js
```

### Regle de prefixage des composants
Tous les composants d'une section sont prefixes par le nom de la section :
- Section `chat` : `chat-nav.jsx`, `chat-room.jsx`, `chat-message-input.jsx`
- Section `kanban` : `kanban-column.jsx`, `kanban-task-item.jsx`
- Section `user` : `user-card.jsx`, `user-table-row.jsx`

---

## SKILL 2 : Composants Custom et Utilisation de MUI

### Composants custom (`src/components/`)
~40 composants custom, tous bases sur MUI. Principaux :

| Composant | Description | Base MUI |
|-----------|-------------|----------|
| `animate` | Animations Framer Motion | - |
| `carousel` | Carrousel (Embla) | Box |
| `chart` | Graphiques (ApexCharts lazy) | Suspense + NoSsr |
| `color-utils` | Color picker/preview | ButtonBase, Popover |
| `country-select` | Autocomplete pays | Autocomplete |
| `custom-breadcrumbs` | Breadcrumbs enrichis | Breadcrumbs |
| `custom-data-grid` | DataGrid etendu | @mui/x-data-grid |
| `custom-dialog` | Dialog wrapper | Dialog |
| `custom-popover` | Popover avec fleche | Popover |
| `editor` | Editeur riche (Tiptap) | Box, ButtonBase |
| `empty-content` | Etat vide | Typography, Box |
| `file-thumbnail` | Preview fichier | Tooltip, Box |
| `hook-form` | Champs React Hook Form | TextField, Select, etc. |
| `iconify` | Icones SVG | @iconify/react |
| `image` | Image lazy-loaded | Box (styled span) |
| `label` | Labels/badges | styled span |
| `lightbox` | Lightbox images | yet-another-react-lightbox |
| `loading-screen` | Ecran chargement | Portal, LinearProgress |
| `logo` | Logo SVG theme | RouterLink |
| `markdown` | Rendu Markdown | react-markdown |
| `nav-section` | Navigation sections | Collapse, Popover |
| `number-input` | Input numerique | ButtonBase, InputBase |
| `phone-input` | Input telephone | react-phone-number-input |
| `scrollbar` | Scrollbar custom | simplebar-react |
| `settings` | Panneau settings | Drawer |
| `snackbar` | Toast notifications | sonner |
| `table` | Table utils + hooks | - |
| `upload` | Upload fichiers | react-dropzone |

### Pattern de creation d'un composant custom

```jsx
'use client';

import { styled } from '@mui/material/styles';
import { mergeClasses, mergeRefs } from 'minimal-shared/utils';

// 1. Classes CSS
export const myComponentClasses = {
  root: createClasses('my-component__root'),
  inner: createClasses('my-component__inner'),
};

// 2. Styled components
const ComponentRoot = styled('div', {
  shouldForwardProp: (prop) => !['variant', 'color'].includes(prop),
})(({ theme }) => ({
  display: 'flex',
  // Utiliser theme.vars pour les CSS variables
  color: theme.vars.palette.text.primary,
  // Utiliser varAlpha pour l'opacite
  borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
  // Transitions MUI
  transition: theme.transitions.create(['all']),
  // Variants conditionnelles
  variants: [
    {
      props: { variant: 'filled' },
      style: { backgroundColor: theme.vars.palette.primary.main },
    },
  ],
}));

// 3. Composant
export function MyComponent({
  sx,                      // Toujours accepter sx
  ref,                     // ref en prop (React 19)
  className,               // className pour merge
  slotProps = {},           // Props pour sous-composants
  variant = 'soft',        // Variant par defaut
  color = 'default',       // Couleur par defaut
  children,
  ...other                 // Spread le reste
}) {
  return (
    <ComponentRoot
      ref={ref}
      className={mergeClasses([myComponentClasses.root, className])}
      sx={[
        { /* styles inline */ },
        ...(Array.isArray(sx) ? sx : [sx]),  // Spread du sx utilisateur
      ]}
      {...other}
    >
      {children}
    </ComponentRoot>
  );
}
```

### Regles de styling

1. **Styled components** (`styled()`) pour les styles complexes et reutilisables
2. **`sx` prop** pour les styles ponctuels, toujours en array syntax pour composition :
   ```jsx
   sx={[{ width: 40 }, ...(Array.isArray(sx) ? sx : [sx])]}
   ```
3. **CSS Variables** pour le theming dynamique :
   ```jsx
   sx={{ '--item-size': `${size}px` }}
   ```
4. **`theme.vars.palette`** (pas `theme.palette`) pour le support CSS variables
5. **`varAlpha()`** de `minimal-shared/utils` pour les couleurs avec opacite
6. **`shouldForwardProp`** pour filtrer les props custom des styled components
7. **Jamais de `useStyles` / `makeStyles`** (ancien pattern MUI v4)

### Imports MUI
```jsx
// Importer chaque composant individuellement (tree-shaking)
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { styled, useTheme } from '@mui/material/styles';

// JAMAIS d'import barrel
// import { Button, TextField } from '@mui/material'; // INTERDIT
```

---

## SKILL 3 : Gestion d'Etat et Data Fetching

### Pas de Redux ni Zustand
L'application utilise :
1. **React Context API** pour l'etat global (auth, settings, checkout)
2. **SWR** pour le fetching de donnees serveur
3. **useState/useCallback/useMemo** pour l'etat local
4. **localStorage/sessionStorage** pour la persistence client
5. **react-hook-form + Zod** pour l'etat des formulaires

### Pattern SWR (Data Fetching)

**Fichier action** (`src/actions/[resource].js`) :
```jsx
import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher, endpoints } from 'src/lib/axios';

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useGetProducts() {
  const url = endpoints.product.list;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => ({
    products: data?.products || [],
    productsLoading: isLoading,
    productsError: error,
    productsValidating: isValidating,
    productsEmpty: !isLoading && !isValidating && !data?.products.length,
  }), [data?.products, error, isLoading, isValidating]);

  return memoizedValue;
}

// Avec parametre dynamique
export function useGetProduct(productId) {
  const url = productId ? [endpoints.product.details, { params: { productId } }] : '';
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);
  // ...
}
```

**Mutation SWR** (mise a jour optimiste) :
```jsx
import { mutate } from 'swr';

mutate(
  ENDPOINT_URL,
  (currentData) => ({
    ...currentData,
    items: updatedItems,
  }),
  false // pas de revalidation
);
```

### Pattern Context

**Structure** :
```
context/
├── [name]-context.js          # createContext(undefined)
├── [name]-provider.jsx        # Provider avec useSetState, useEffect, useMemo
└── use-[name]-context.js      # Hook use() avec error handling
```

**Implementation** :
```jsx
// [name]-context.js
import { createContext } from 'react';
export const MyContext = createContext(undefined);

// [name]-provider.jsx
'use client';
import { useMemo, useEffect, useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';
import { MyContext } from './my-context';

export function MyProvider({ children }) {
  const { state, setState } = useSetState({ data: null, loading: true });

  const memoizedValue = useMemo(() => ({
    ...state,
    doSomething: () => setState({ /* ... */ }),
  }), [state, setState]);

  return (
    <MyContext value={memoizedValue}>
      {children}
    </MyContext>
  );
}

// use-my-context.js
import { use } from 'react';
import { MyContext } from './my-context';

export function useMyContext() {
  const context = use(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
}
```

### Pattern Formulaires

```jsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

const MySchema = z.object({
  name: z.string().min(1, { error: 'Requis !' }),
  email: schemaUtils.email({ error: 'Email invalide !' }),
  phone: schemaUtils.phoneNumber({ error: 'Numero invalide !' }),
  avatar: schemaUtils.file({ error: 'Avatar requis !' }),
});

export function MyForm({ currentItem }) {
  const defaultValues = { name: '', email: '', phone: '', avatar: null };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(MySchema),
    defaultValues: currentItem || defaultValues,
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await saveData(data);
      toast.success('Sauvegarde !');
      router.push(paths.dashboard.section.root);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Field.Text name="name" label="Nom" />
      <Field.Text name="email" label="Email" />
      <Field.Phone name="phone" label="Telephone" />
      <Field.Upload name="avatar" />
      <LoadingButton type="submit" loading={isSubmitting}>Sauvegarder</LoadingButton>
    </Form>
  );
}
```

**Champs disponibles** (composant `Field`) :
`Field.Text`, `Field.Select`, `Field.MultiSelect`, `Field.Checkbox`, `Field.Switch`,
`Field.RadioGroup`, `Field.DatePicker`, `Field.Upload`, `Field.UploadAvatar`,
`Field.Editor`, `Field.Autocomplete`, `Field.CountrySelect`, `Field.PhoneInput`,
`Field.Rating`, `Field.Slider`, `Field.NumberInput`, `Field.Code`

### Axios (`src/lib/axios.js`)

```jsx
import axios from 'axios';
import { CONFIG } from 'src/global-config';

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

// Fetcher pour SWR
export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.get(url, { ...config });
  return res.data;
};

// Endpoints centralises
export const endpoints = {
  auth: { me: '/api/auth/me', signIn: '/api/auth/sign-in', signUp: '/api/auth/sign-up' },
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  mail: { list: '/api/mail/list', details: '/api/mail/details', labels: '/api/mail/labels' },
  post: { list: '/api/post/list', details: '/api/post/details', latest: '/api/post/latest', search: '/api/post/search' },
  product: { list: '/api/product/list', details: '/api/product/details', search: '/api/product/search' },
};
```

---

## SKILL 4 : Routing et Navigation (Next.js App Router)

### Architecture des routes (`src/app/`)

```
src/app/
├── layout.jsx            # Root layout (providers globaux)
├── loading.jsx           # Loading global
├── not-found.jsx         # 404 global
├── (home)/               # Route group (pas dans l'URL)
│   ├── layout.jsx        # MainLayout
│   └── page.jsx          # Page d'accueil
├── dashboard/            # Routes protegees
│   ├── layout.jsx        # AuthGuard + DashboardLayout
│   ├── loading.jsx       # Loading du dashboard
│   ├── page.jsx          # Dashboard root
│   ├── [section]/        # Sous-sections
│   │   ├── page.jsx
│   │   ├── new/page.jsx
│   │   ├── [id]/
│   │   │   └── edit/page.jsx
│   │   └── ...
│   └── ...
├── auth/                 # Routes authentification
│   └── jwt/
│       ├── sign-in/
│       │   ├── layout.jsx  # GuestGuard + AuthSplitLayout
│       │   └── page.jsx
│       └── sign-up/
│           ├── layout.jsx
│           └── page.jsx
└── [pages-publiques]/    # about-us, pricing, faqs, etc.
```

### Pattern d'une page

```jsx
// src/app/dashboard/user/page.jsx
import { UserListView } from 'src/sections/user/view';

export const metadata = { title: 'Dashboard: User List' };

export default function Page() {
  return <UserListView />;
}
```

### Pattern d'un layout protege

```jsx
// src/app/dashboard/layout.jsx
import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';
import { AuthGuard } from 'src/auth/guard';

export default function Layout({ children }) {
  if (CONFIG.auth.skip) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
```

### Paths centralises (`src/routes/paths.js`)

```jsx
const ROOTS = { AUTH: '/auth', DASHBOARD: '/dashboard' };

export const paths = {
  // Pages publiques
  about: '/about-us',
  contact: '/contact-us',
  pricing: '/pricing',
  faqs: '/faqs',

  // Erreurs
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',

  // Auth (par provider)
  auth: {
    jwt: { signIn: `${ROOTS.AUTH}/jwt/sign-in`, signUp: `${ROOTS.AUTH}/jwt/sign-up` },
    // + amplify, firebase, auth0, supabase
  },

  // Dashboard (CRUD pattern)
  dashboard: {
    root: ROOTS.DASHBOARD,
    general: { app: '/dashboard/app', analytics: '/dashboard/analytics', /* ... */ },
    user: {
      root: '/dashboard/user',
      list: '/dashboard/user/list',
      new: '/dashboard/user/new',
      edit: (id) => `/dashboard/user/${id}/edit`,
    },
    // Meme pattern pour product, invoice, post, job, tour, order
    mail: '/dashboard/mail',
    chat: '/dashboard/chat',
    kanban: '/dashboard/kanban',
    calendar: '/dashboard/calendar',
    fileManager: '/dashboard/file-manager',
  },
};
```

### Hooks de routing custom (`src/routes/hooks/`)
- `useRouter()` : Wrapper de `next/navigation` avec NProgress
- `usePathname()` : Re-export de `next/navigation`
- `useParams()` : Re-export de `next/navigation`
- `useSearchParams()` : Re-export de `next/navigation`

```jsx
import { useRouter } from 'src/routes/hooks';
// TOUJOURS importer depuis 'src/routes/hooks', jamais depuis 'next/navigation'
```

### Navigation dashboard (`src/layouts/nav-config-dashboard.jsx`)
```jsx
export const navData = [
  {
    subheader: 'Overview',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      // ...
    ],
  },
  {
    subheader: 'Management',
    items: [
      {
        title: 'User',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: 'List', path: paths.dashboard.user.list },
          { title: 'Create', path: paths.dashboard.user.new },
          // ...
        ],
      },
    ],
  },
  {
    subheader: 'Misc',
    items: [
      {
        title: 'Permission',
        path: paths.dashboard.permission,
        allowedRoles: ['admin', 'manager'],  // Visibilite par role
      },
    ],
  },
];
```

---

## SKILL 5 : Authentification

### Architecture auth (`src/auth/`)

```
src/auth/
├── context/
│   ├── auth-context.jsx           # createContext base
│   └── jwt/                       # Provider JWT (actif)
│       ├── auth-provider.jsx      # JwtAuthProvider
│       ├── action.js              # signInWithPassword, signUp, signOut
│       ├── utils.js               # jwtDecode, isValidToken, setSession, tokenExpired
│       └── constant.js            # JWT_STORAGE_KEY
├── guard/
│   ├── auth-guard.jsx             # Protege les routes authentifiees
│   ├── guest-guard.jsx            # Protege les routes publiques (login)
│   └── role-based-guard.jsx       # Protege par role
├── hooks/
│   ├── index.js
│   └── use-mocked-user.js
├── components/                    # Composants UI auth (FormHead, FormSocials, etc.)
├── utils/
│   └── error-message.js           # getErrorMessage()
└── view/
    └── jwt/                       # Vues sign-in / sign-up
        ├── jwt-sign-in-view.jsx
        └── jwt-sign-up-view.jsx
```

### Flux d'authentification JWT

1. **Sign In** : `POST /api/auth/sign-in` -> recoit `accessToken` -> `setSession(token)` -> stocke en `sessionStorage`
2. **Check Session** : Lit token de `sessionStorage` -> `isValidToken()` -> `GET /api/auth/me` -> met a jour le contexte
3. **Sign Out** : `setSession(null)` -> supprime token -> supprime header Authorization
4. **Token Expiration** : `setTimeout` automatique qui alerte et redirige vers login

### Utilisation dans un composant

```jsx
import { useAuthContext } from 'src/auth/hooks';

function MyComponent() {
  const { user, authenticated, loading } = useAuthContext();

  if (loading) return <SplashScreen />;
  if (!authenticated) return null;

  return <div>Bienvenue {user.displayName}</div>;
}
```

### Configuration (`src/global-config.js`)

```jsx
export const CONFIG = {
  auth: {
    method: 'jwt',                              // 'jwt' | 'amplify' | 'firebase' | 'supabase' | 'auth0'
    skip: false,                                // true pour desactiver l'auth
    redirectPath: paths.dashboard.root,          // Redirection apres login
  },
};
```

---

## SKILL 6 : Layouts

### Hierarchie des providers (Root Layout)

```
I18nProvider
  └── AuthProvider (configurable: JWT, Firebase, Auth0, Amplify, Supabase)
       └── SettingsProvider
            └── LocalizationProvider (dayjs)
                 └── AppRouterCacheProvider (MUI/Emotion)
                      └── ThemeProvider (MUI)
                           └── MotionLazy (Framer Motion)
                                └── CheckoutProvider
                                     └── Snackbar + ProgressBar + SettingsDrawer
                                          └── {children}
```

### DashboardLayout (`src/layouts/dashboard/`)
- Navigation adaptative : vertical, mini, horizontal (configurable via settings)
- Header : workspace selector, recherche, langue, notifications, compte
- Sidebar avec filtrage par role (`allowedRoles` sur les items nav)
- Responsive avec breakpoint `layoutQuery`

### MainLayout (`src/layouts/main/`)
- Header : Logo, navigation desktop/mobile, bouton settings, bouton sign-in
- Footer adaptatif (home vs autres pages)

### AuthLayouts
- `AuthSplitLayout` : Ecran coupe en deux (formulaire + illustration)
- `AuthCenteredLayout` : Formulaire centre

---

## SKILL 7 : Pattern pour Creer une Nouvelle Section

### Checklist pour ajouter une nouvelle section CRUD

1. **Creer la section** dans `src/sections/[nom-section]/`
   ```
   nom-section/
   ├── view/
   │   ├── index.js
   │   ├── nom-section-list-view.jsx
   │   ├── nom-section-create-view.jsx
   │   └── nom-section-edit-view.jsx
   ├── nom-section-table-row.jsx
   ├── nom-section-table-toolbar.jsx
   ├── nom-section-table-filters-result.jsx
   └── nom-section-create-edit-form.jsx
   ```

2. **Creer les routes** dans `src/app/dashboard/[nom-section]/`
   ```
   nom-section/
   ├── page.jsx          # Liste (importe la view)
   ├── new/
   │   └── page.jsx      # Creation
   └── [id]/
       └── edit/
           └── page.jsx  # Edition
   ```

3. **Ajouter les paths** dans `src/routes/paths.js`
   ```jsx
   nomSection: {
     root: '/dashboard/nom-section',
     list: '/dashboard/nom-section/list',
     new: '/dashboard/nom-section/new',
     edit: (id) => `/dashboard/nom-section/${id}/edit`,
   },
   ```

4. **Ajouter la navigation** dans `src/layouts/nav-config-dashboard.jsx`
   ```jsx
   {
     title: 'Nom Section',
     path: paths.dashboard.nomSection.root,
     icon: ICONS.monIcone,
     children: [
       { title: 'List', path: paths.dashboard.nomSection.list },
       { title: 'Create', path: paths.dashboard.nomSection.new },
     ],
   },
   ```

5. **Creer l'action SWR** dans `src/actions/nom-section.js`
   ```jsx
   export function useGetNomSections() { /* pattern SWR */ }
   export function useGetNomSection(id) { /* pattern SWR avec id */ }
   ```

6. **Ajouter les endpoints** dans `src/lib/axios.js`
   ```jsx
   nomSection: {
     list: '/api/nom-section/list',
     details: '/api/nom-section/details',
   },
   ```

### Structure d'une vue type

```jsx
'use client';

import { useState, useCallback } from 'react';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useGetNomSections } from 'src/actions/nom-section';

export function NomSectionListView() {
  const table = useTable();
  const router = useRouter();
  const { nomSections, nomSectionsLoading } = useGetNomSections();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Liste"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Nom Section', href: paths.dashboard.nomSection.root },
          { name: 'Liste' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.nomSection.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouveau
          </Button>
        }
      />

      <Card>
        <TableContainer>
          <Scrollbar>
            <Table>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {/* Rows */}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
        <TablePaginationCustom
          page={table.page}
          count={nomSections.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
```

---

## SKILL 8 : Librairies et Utilitaires Cles

### Librairies principales

| Librairie | Usage | Import |
|-----------|-------|--------|
| `minimal-shared` | Hooks et utils partages | `minimal-shared/hooks`, `minimal-shared/utils` |
| `es-toolkit` | Utilitaires (union, isEqual, keyBy, kebabCase) | `es-toolkit` |
| `dayjs` | Dates avec locales | `dayjs` |
| `framer-motion` | Animations | `framer-motion` |
| `sonner` | Toast notifications | `sonner` (via `toast.success()`, `toast.error()`) |
| `@iconify/react` | Icones (via composant Iconify) | `src/components/iconify` |
| `nprogress` | Barre de progression | via `useRouter` custom |
| `swr` | Data fetching reactif | `swr` |
| `react-hook-form` | Gestion formulaires | via `src/components/hook-form` |
| `zod` | Validation schemas | `zod` |
| `@tiptap/*` | Editeur riche | via `src/components/editor` |
| `embla-carousel-react` | Carrousel | via `src/components/carousel` |
| `react-apexcharts` | Graphiques | via `src/components/chart` |
| `@atlaskit/pragmatic-drag-and-drop` | Drag & Drop | import direct dans sections |
| `@fullcalendar/*` | Calendrier | import direct dans section calendar |
| `simplebar-react` | Scrollbar | via `src/components/scrollbar` |
| `react-dropzone` | Upload fichiers | via `src/components/upload` |

### Utilitaires `minimal-shared`

**Hooks** :
- `useSetState()` - setState style avec merge
- `useLocalStorage()` - Persistence localStorage reactive
- `useCookies()` - Gestion cookies
- `useBoolean()` - Toggle boolean
- `usePopover()` - Etat popover (open, anchorEl, onOpen, onClose)

**Utils** :
- `varAlpha(channel, opacity)` - Couleur avec opacite
- `mergeClasses([...classes])` - Merge classNames
- `mergeRefs([...refs])` - Merge refs React
- `createClasses(name)` - Creer un nom de classe BEM
- `isEqualPath()` - Comparer des chemins URL

---

## Regles Generales

1. **Toujours `'use client'`** en haut des fichiers avec hooks/state/interactivite
2. **Imports MUI individuels** (tree-shaking) : `import Button from '@mui/material/Button'`
3. **Pas de TypeScript** : tout est en JavaScript (.js/.jsx)
4. **Exports nommes** (pas de `export default` sauf pages Next.js)
5. **Pas de PropTypes** : utiliser la destructuration avec valeurs par defaut
6. **Toast** : `toast.success()` / `toast.error()` de `sonner`
7. **Erreurs** : `getErrorMessage(error)` de `src/auth/utils/error-message.js`
8. **Router** : toujours `useRouter` de `src/routes/hooks` (pas de `next/navigation`)
9. **Icones** : `<Iconify icon="nom-pack:nom-icone" />` (pas de SVG manuels)
10. **Loading** : `<LoadingScreen />` pour plein ecran, `<SplashScreen />` pour auth
11. **Table** : `useTable()` hook de `src/components/table`
12. **Breadcrumbs** : `<CustomBreadcrumbs />` avec `heading`, `links`, `action`
13. **Wrapper de page** : `<DashboardContent maxWidth="xl">` dans les vues
14. **Render functions** : utiliser `const renderSection = () => (...)` pour les sous-parties de JSX
