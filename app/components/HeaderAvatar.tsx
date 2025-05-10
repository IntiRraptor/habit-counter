import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { UserAvatar } from './UserAvatar';

type HeaderAvatarProps = {
  imageUrl?: string | null;
  firstName?: string;
  lastName?: string;
  showName?: boolean;
  size?: number;
};

export function HeaderAvatar({
  imageUrl,
  firstName = '',
  lastName = '',
  showName = true,
  size = 48
}: HeaderAvatarProps) {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  // Obtener solo el primer nombre para mostrar
  const displayName = firstName.split(' ')[0];

  const handlePress = () => {
    router.push('/profile');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <ThemedView style={[styles.wrapper, { backgroundColor }]}>
        <UserAvatar
          imageUrl={imageUrl}
          firstName={firstName}
          lastName={lastName}
          size={size}
        />

        {showName && displayName && (
          <ThemedText style={styles.nameText}>
            Bienvenido de nuevo {displayName}!
          </ThemedText>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nameText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  }
}); 