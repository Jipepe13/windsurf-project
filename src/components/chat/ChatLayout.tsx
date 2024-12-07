import React from 'react';
import { Box, Grid, useTheme } from '@mui/material';
import UsersList from './UsersList';
import ChatRoom from './ChatRoom';
import { styled } from '@mui/material/styles';

const ChatContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  background: 'linear-gradient(45deg, #1a237e 30%, #311b92 90%)',
  padding: theme.spacing(2),
  display: 'flex',
}));

const ChatLayout = () => {
  const theme = useTheme();

  return (
    <ChatContainer>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={3}>
          <UsersList />
        </Grid>
        <Grid item xs={12} md={9}>
          <ChatRoom />
        </Grid>
      </Grid>
    </ChatContainer>
  );
};

export default ChatLayout;
