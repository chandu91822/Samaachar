import { Box, Container, Typography } from '@mui/material'

export default function Hero() {
  return (
    <Box sx={{ pt: 12, pb: 6, textAlign: 'center' }}>
      <Container className="container">
        <Typography variant="h3" className="hero-title" gutterBottom>
          Delivering News, Delivering Trust.
        </Typography>
        <Typography variant="h6" className="hero-sub">
          A complete automation platform for newspaper & magazine distribution agencies.
        </Typography>
      </Container>
    </Box>
  )
}
