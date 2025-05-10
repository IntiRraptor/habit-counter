import { AuthProvider } from "@/app/components/AuthContext";
import { useColorScheme } from "@/app/hooks/useColorScheme";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { useAuthStore } from "@/app/store/authStore";
import { useThemeStore } from "@/app/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore(state => state.initialize);
  const loadTheme = useThemeStore(state => state.loadTheme);

  // Initialize auth and theme state
  useEffect(() => {
    initialize();
    loadTheme();
  }, [initialize, loadTheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(private)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="index" redirect={true} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}

export function PrivateLayout() {
  const { isAuthenticated } = useAuthStore();
  const tabIconColor = useThemeColor({}, "tabIconDefault");
  const tabIconSelectedColor = useThemeColor({}, "tabIconSelected");
  const backgroundColor = useThemeColor({}, "background");

  // Si no está autenticado, redirigir a la ruta pública
  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Ocultar los headers por defecto
        tabBarActiveTintColor: tabIconSelectedColor,
        tabBarInactiveTintColor: tabIconColor,
        tabBarStyle: { backgroundColor },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="stats"
        options={{
          title: "Estadísticas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="habit/new"
        options={{
          title: "Nuevo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Pantallas ocultas del tab bar pero accesibles */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      
      <Tabs.Screen
        name="edit-profile"
        options={{
          headerTitle: "Editar Perfil",
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      
      <Tabs.Screen
        name="habit/[id]/index"
        options={{
          title: "Detalle",
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      
      <Tabs.Screen
        name="habit/[id]/log"
        options={{
          title: "Registrar",
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      
      <Tabs.Screen
        name="habit/[id]/edit"
        options={{
          title: "Editar Hábito",
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
