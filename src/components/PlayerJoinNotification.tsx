import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, UserPlus, UserMinus, Activity } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  joinedAt: number;
  isOnline: boolean;
}

interface Notification {
  id: string;
  type: 'join' | 'leave' | 'reconnect';
  playerName: string;
  timestamp: number;
}

interface PlayerJoinNotificationProps {
  players: Player[];
  maxNotifications?: number;
  autoHide?: boolean;
  hideDelay?: number;
}

export const PlayerJoinNotification: React.FC<PlayerJoinNotificationProps> = ({
  players,
  maxNotifications = 3,
  autoHide = true,
  hideDelay = 3000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [previousPlayers, setPreviousPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Detect new players
    const newPlayers = players.filter(player => 
      !previousPlayers.some(prev => prev.id === player.id)
    );
    
    // Detect players who left
    const leftPlayers = previousPlayers.filter(prev => 
      !players.some(player => player.id === prev.id)
    );
    
    // Detect players who reconnected
    const reconnectedPlayers = players.filter(player => 
      previousPlayers.some(prev => prev.id === player.id && !prev.isOnline && player.isOnline)
    );

    const newNotifications: Notification[] = [
      ...newPlayers.map(player => ({
        id: `join-${player.id}-${Date.now()}`,
        type: 'join' as const,
        playerName: player.name,
        timestamp: Date.now()
      })),
      ...leftPlayers.map(player => ({
        id: `leave-${player.id}-${Date.now()}`,
        type: 'leave' as const,
        playerName: player.name,
        timestamp: Date.now()
      })),
      ...reconnectedPlayers.map(player => ({
        id: `reconnect-${player.id}-${Date.now()}`,
        type: 'reconnect' as const,
        playerName: player.name,
        timestamp: Date.now()
      }))
    ];

    if (newNotifications.length > 0) {
      setNotifications(prev => [
        ...newNotifications,
        ...prev.slice(0, maxNotifications - newNotifications.length)
      ]);
    }

    setPreviousPlayers(players);
  }, [players, maxNotifications, previousPlayers]);

  useEffect(() => {
    if (autoHide && notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, hideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [notifications, autoHide, hideDelay]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'join':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'leave':
        return <UserMinus className="h-4 w-4 text-red-600" />;
      case 'reconnect':
        return <Wifi className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'join':
        return `${notification.playerName} joined the game`;
      case 'leave':
        return `${notification.playerName} left the game`;
      case 'reconnect':
        return `${notification.playerName} reconnected`;
      default:
        return '';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'join':
        return 'border-green-200 bg-green-50';
      case 'leave':
        return 'border-red-200 bg-red-50';
      case 'reconnect':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification, index) => (
        <Card 
          key={notification.id}
          className={`${getNotificationColor(notification.type)} animate-slide-in-right shadow-lg`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {getNotificationMessage(notification)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface PlayerCounterProps {
  players: Player[];
  maxPlayers?: number;
  showOnlineStatus?: boolean;
}

export const PlayerCounter: React.FC<PlayerCounterProps> = ({
  players,
  maxPlayers,
  showOnlineStatus = true
}) => {
  const onlinePlayers = players.filter(p => p.isOnline);
  
  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {players.length} Player{players.length !== 1 ? 's' : ''}
                {maxPlayers && ` / ${maxPlayers}`}
              </p>
              {showOnlineStatus && (
                <p className="text-sm text-muted-foreground">
                  {onlinePlayers.length} online
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="secondary" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};