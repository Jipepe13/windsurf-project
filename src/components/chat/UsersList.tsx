import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Badge,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const OnlineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const UsersList = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  // Mock users data
  const users = [
    { id: 1, name: 'Alice', status: 'online', avatar: 'A' },
    { id: 2, name: 'Bob', status: 'online', avatar: 'B' },
    { id: 3, name: 'Charlie', status: 'offline', avatar: 'C' },
    // Add more mock users as needed
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper 
      sx={{ 
        height: '100%', 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher un utilisateur..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ p: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <List sx={{ 
        overflow: 'auto',
        flex: 1,
        '& .MuiListItem-root': {
          fontSize: '0.85rem',
        }
      }}>
        {filteredUsers.map((user) => (
          <ListItem
            key={user.id}
            button
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemAvatar>
              {user.status === 'online' ? (
                <OnlineBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                >
                  <Avatar>{user.avatar}</Avatar>
                </OnlineBadge>
              ) : (
                <Avatar>{user.avatar}</Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              primary={user.name}
              secondary={user.status}
              primaryTypographyProps={{
                variant: 'body2',
                style: { fontWeight: 500 }
              }}
              secondaryTypographyProps={{
                variant: 'caption'
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default UsersList;
