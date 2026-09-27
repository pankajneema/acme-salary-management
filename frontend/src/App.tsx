import {
  ActionIcon,
  AppShell,
  Container,
  Group,
  NavLink as MantineNavLink,
  Text,
  ThemeIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { IconCoin, IconMoon, IconSun, IconUsers } from '@tabler/icons-react'
import { NavLink, Outlet } from 'react-router'

const NAV_ITEMS = [{ to: '/employees', label: 'Employees', icon: IconUsers }]

export function AppLayout() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="xl" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="lg" radius="md" variant="gradient">
                  <IconCoin size={20} />
                </ThemeIcon>
                <Text fw={700} visibleFrom="xs">
                  ACME Salaries
                </Text>
              </Group>
              <Group gap={4} wrap="nowrap">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
                    {({ isActive }) => (
                      <MantineNavLink
                        component="span"
                        label={label}
                        active={isActive}
                        leftSection={<Icon size={16} />}
                        variant="light"
                        style={{ borderRadius: 'var(--mantine-radius-md)' }}
                      />
                    )}
                  </NavLink>
                ))}
              </Group>
            </Group>
            <ColorSchemeToggle />
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl" py="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const scheme = useComputedColorScheme('light')
  const next = scheme === 'dark' ? 'light' : 'dark'
  return (
    <Tooltip label={`Switch to ${next} mode`}>
      <ActionIcon
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
        onClick={() => setColorScheme(next)}
      >
        {scheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  )
}
