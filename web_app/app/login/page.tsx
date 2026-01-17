"use client";

import { Authenticator } from '@aws-amplify/ui-react';
import { useTheme, View, Image, Text, Heading, Button, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const components = {
    Header() {
        return (
            <View textAlign="center" padding="large">
                <div className="text-4xl mb-4">🏛️</div>
                <Heading level={3}>JuSt_Greek</Heading>
                <Text>Sign In to track your XP & Streaks</Text>
            </View>
        );
    },
};

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <Authenticator components={components}>
                {({ signOut, user }) => (
                    <main className="text-center space-y-4">
                        <h1 className="text-2xl font-bold">Welcome back, {user?.signInDetails?.loginId}!</h1>
                        <p>You are now logged in.</p>
                        <Button onClick={() => window.location.href = "/"}>Go to Dashboard</Button>
                        <Button onClick={signOut} variation="link">Sign Out</Button>
                    </main>
                )}
            </Authenticator>
        </div>
    );
}
