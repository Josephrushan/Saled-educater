import React, { useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '../services/firebase';
import { Bell, Download } from 'lucide-react';

const PWAControls: React.FC = () => {
    // Disabled: Removed notification and install app buttons
    return null;
};

export default PWAControls;