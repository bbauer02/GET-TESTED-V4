'use client';

import { m } from 'framer-motion';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { varTap, varHover, transitionTap } from 'src/components/animate';

import { NotificationItem } from './notification-item';

// ----------------------------------------------------------------------

export function NotificationsDrawer({ data = [], sx, ...other }) {
  const { t } = useTranslate('layout');

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const [currentTab, setCurrentTab] = useState('all');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const [readIds, setReadIds] = useState(new Set());

  const notifications = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        isUnRead: readIds.has(item.id) ? false : item.isUnRead,
      })),
    [data, readIds]
  );

  const totalUnRead = notifications.filter((item) => item.isUnRead).length;

  const filteredNotifications = useMemo(() => {
    if (currentTab === 'unread') return notifications.filter((n) => n.isUnRead);
    if (currentTab === 'read') return notifications.filter((n) => !n.isUnRead);
    return notifications;
  }, [notifications, currentTab]);

  const tabs = useMemo(
    () => [
      { value: 'all', label: t('tab_all'), count: notifications.length },
      { value: 'unread', label: t('tab_unread'), count: totalUnRead },
      { value: 'read', label: t('tab_read'), count: notifications.length - totalUnRead },
    ],
    [notifications.length, totalUnRead, t]
  );

  const handleMarkAllAsRead = () => {
    setReadIds(new Set(data.map((n) => n.id)));
  };

  const renderHead = () => (
    <Box
      sx={{
        py: 2,
        pr: 1,
        pl: 2.5,
        minHeight: 68,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        {t('notifications')}
      </Typography>

      {!!totalUnRead && (
        <Tooltip title={t('mark_all_read')}>
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={onClose} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Box>
  );

  const renderTabs = () => (
    <Tabs variant="fullWidth" value={currentTab} onChange={handleChangeTab}>
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
              color={
                (tab.value === 'unread' && 'info') ||
                (tab.value === 'read' && 'success') ||
                'default'
              }
            >
              {tab.count}
            </Label>
          }
        />
      ))}
    </Tabs>
  );

  const renderList = () => (
    <Scrollbar>
      {filteredNotifications.length > 0 ? (
        <Box component="ul">
          {filteredNotifications.map((notification) => (
            <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
              <NotificationItem notification={notification} />
            </Box>
          ))}
        </Box>
      ) : (
        <EmptyContent title={t('no_notifications')} sx={{ py: 6 }} />
      )}
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap={varTap(0.96)}
        whileHover={varHover(1.04)}
        transition={transitionTap()}
        aria-label={t('notifications')}
        onClick={onOpen}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={totalUnRead} color="error">
          <Iconify width={24} icon="solar:bell-bing-bold-duotone" />
        </Badge>
      </IconButton>

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 1, maxWidth: 420 } },
        }}
      >
        {renderHead()}
        {renderTabs()}
        {renderList()}
      </Drawer>
    </>
  );
}
