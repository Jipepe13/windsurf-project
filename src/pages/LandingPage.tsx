import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const BackgroundBox = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(45deg, #1a237e 30%, #311b92 90%)',
  padding: '2rem',
});

const Feature = ({ title, description, imageUrl }: { title: string; description: string; imageUrl: string }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardMedia
      component="img"
      height="140"
      image={imageUrl}
      alt={title}
      sx={{ objectFit: 'cover' }}
    />
    <CardContent>
      <Typography gutterBottom variant="h5" component="div">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const LandingPage = () => {
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);

  const features = [
    {
      title: 'Chat en temps réel',
      description: 'Communiquez instantanément avec d\'autres utilisateurs via notre système de chat moderne',
      imageUrl: 'https://source.unsplash.com/random/800x600/?chat'
    },
    {
      title: 'Partage multimédia',
      description: 'Partagez facilement vos photos et vidéos avec la communauté',
      imageUrl: 'https://source.unsplash.com/random/800x600/?sharing'
    },
    {
      title: 'Appels vidéo',
      description: 'Profitez d\'appels vidéo en HD avec vos contacts',
      imageUrl: 'https://source.unsplash.com/random/800x600/?videocall'
    },
    {
      title: '100% Gratuit',
      description: 'Toutes les fonctionnalités sont gratuites, sans frais cachés',
      imageUrl: 'https://source.unsplash.com/random/800x600/?free'
    }
  ];

  return (
    <BackgroundBox>
      <Dialog open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)}>
        <DialogTitle>⚠️ Avertissement</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Ce site peut contenir du contenu explicite ne convenant pas aux mineurs.
            En continuant, vous confirmez que :
          </Typography>
          <Typography component="ul">
            <li>Vous avez 18 ans ou plus</li>
            <li>Vous acceptez de voir du contenu pour adultes</li>
            <li>L'accès à ce site est légal dans votre juridiction</li>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.location.href = "https://www.google.com"}>
            Quitter
          </Button>
          <Button onClick={() => setDisclaimerOpen(false)} autoFocus>
            J'accepte
          </Button>
        </DialogActions>
      </Dialog>

      <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Bienvenue sur WebChat
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Votre plateforme de chat gratuite et sécurisée
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Feature {...feature} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          sx={{ mr: 2 }}
          href="/register"
        >
          S'inscrire gratuitement
        </Button>
        <Button
          variant="outlined"
          size="large"
          sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          href="/login"
        >
          Se connecter
        </Button>
      </Box>
    </BackgroundBox>
  );
};

export default LandingPage;
