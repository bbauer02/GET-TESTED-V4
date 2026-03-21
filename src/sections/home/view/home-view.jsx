'use client';

import Stack from '@mui/material/Stack';

import { ScrollProgress, BackToTopButton, useScrollProgress } from 'src/components/animate';

import { HomeCta } from '../home-cta';
import { HomeHero } from '../home-hero';
import { HomeStats } from '../home-stats';
import { HomeFeatures } from '../home-features';
import { HomeAudiences } from '../home-audiences';
import { HomeHowItWorks } from '../home-how-it-works';

// ----------------------------------------------------------------------

export function HomeView() {
  const pageProgress = useScrollProgress();

  return (
    <>
      <ScrollProgress
        variant="linear"
        progress={pageProgress.scrollYProgress}
        sx={{ position: 'fixed', zIndex: 9999 }}
      />

      <BackToTopButton />

      <Stack component="main">
        <HomeHero />
        <HomeFeatures />
        <HomeHowItWorks />
        <HomeStats />
        <HomeAudiences />
        <HomeCta />
      </Stack>
    </>
  );
}
