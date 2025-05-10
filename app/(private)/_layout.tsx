import { useThemeColor } from "@/app/hooks/useThemeColor";
import { useAuthStore } from "@/app/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

export default function PrivateLayout() {
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
        tabBarActiveTintColor: tabIconSelectedColor,
        tabBarInactiveTintColor: tabIconColor,
        tabBarStyle: { backgroundColor },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
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
          title: "Nuevo Hábito",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Pantallas ocultas del tab bar pero accesibles */}
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: "Perfil",
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

      <Tabs.Screen
        name="home"
        options={{
          href: null,
          headerTitle: "Home",
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
