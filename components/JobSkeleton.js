import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';

export default function JobSkeleton() {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Skeleton width={80} height={20} borderRadius={8} />
                <Skeleton width={60} height={20} borderRadius={8} />
            </View>
            <View style={styles.body}>
                <Skeleton width="90%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={16} style={{ marginBottom: 6 }} />
                <Skeleton width="70%" height={16} style={{ marginBottom: 16 }} />
            </View>
            <View style={styles.footer}>
                <Skeleton width={100} height={16} />
                <View style={{ flex: 1 }} />
                <Skeleton width={80} height={16} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    body: {
        marginBottom: 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
});
