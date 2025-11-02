import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Star, Film, Loader2, ThumbsUp, RefreshCw } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  plot: string;
  year: number;
  genre: string;
  rating?: number;
  director?:string;
}

// Keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #e2e8f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  width: 100%;
  overflow-x: hidden; /* Prevent horizontal scroll */
`;

const Header = styled.header`
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  z-index: 40;
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(to right, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  margin-top: 0.5rem;
  font-size: 1rem;
`;

const Main = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  width: 100%; /* Ensures it stretches to container */
`;
const SectionTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 1.5rem;
`;

const RefreshButton = styled.button`
  background: linear-gradient(to right, #3b82f6, #6366f1);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const MoviesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const MovieCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  animation: ${fadeIn} 0.4s ease-out;

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 20px 30px rgba(0, 0, 0, 0.3);
  }
`;

const CardImage = styled.div`
  height: 180px;
  background: linear-gradient(135deg, #1e40af, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const MovieTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 0.75rem;
`;

const Tags = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span<{ color: 'blue' | 'purple' }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 500;
  background: ${({ color }) =>
    color === 'blue' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)'};
  color: ${({ color }) => (color === 'blue' ? '#93c5fd' : '#c4b5fd')};
`;

const Plot = styled.p`
  color: #cbd5e1;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RatingLabel = styled.p`
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

// Star Rating
const StarContainer = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.3);
  }
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: #1e293b;
  border-radius: 1.5rem;
  max-width: 600px;
  width: 100%;
  border: 1px solid rgba(59, 130, 246, 0.3);
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;
`;

const ModalImage = styled.div`
  height: 200px;
  background: linear-gradient(135deg, #1e40af, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const ModalTitle = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 1rem;
`;

const ModalTags = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const SynopsisTitle = styled.h3`
  color: #60a5fa;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
`;

const Synopsis = styled.p`
  color: #cbd5e1;
  line-height: 1.7;
  margin-bottom: 1.5rem;
`;

const CloseButton = styled.button`
  background: linear-gradient(to right, #3b82f6, #6366f1);
  color: white;
  width: 100%;
  padding: 0.875rem;
  border-radius: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
  }
`;

// Notification
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const Notification = styled.div`
  position: fixed;
  top: 5rem;
  right: 1.5rem;
  background: linear-gradient(to right, #10b981, #059669);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
  z-index: 60;
  animation: ${slideIn} 0.4s ease-out;
  font-weight: 500;
`;

// Loader
const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
`;

const Spinner = styled(Loader2)`
  color: #60a5fa;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

//Comment Section

const CommentSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(59, 130, 246, 0.2);
`;

const CommentLabel = styled.label`
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  display: block;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: #e2e8f0;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  max-height: 120px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }

  &::placeholder {
    color: #64748b;
  }
`;

const CharacterCount = styled.div<{ $isNearLimit: boolean }>`
  text-align: right;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  color: ${({ $isNearLimit }) => ($isNearLimit ? '#f87171' : '#64748b')};
  font-weight: ${({ $isNearLimit }) => ($isNearLimit ? '600' : '400')};
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const SubmitButton = styled(CloseButton)`
  background: linear-gradient(to right, #10b981, #059669);

  &:hover {
    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CancelButton = styled(CloseButton)`
  background: rgba(71, 85, 105, 0.6);

  &:hover {
    background: rgba(71, 85, 105, 0.8);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

export default function MoviesFrontend() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [userRatings, setUserRatings] = useState<{ [key: number]: number }>({});
  const [notification, setNotification] = useState<string>('');
  const [movieComment,setMovieComment]=useState<string>("");
  const [tempRating, setTempRating] = useState<number>(0);

  const fetchRandomMovies = async (count = 7) => {
    setLoading(true);
    try {
     const response = await fetch(
      `http://localhost:3001/random-movies?count=${count}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const moviesDB = await response.json();
    setMovies(moviesDB);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reemplaza la función submitRating con esta versión:

const submitRating = async (movieId: number, rating: number) => {
  try {
    const calificationsurl=process.env.CALIFICATIONS_URL ||"http://localhost:3003";
    const response = await fetch( calificationsurl+'/rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1,
        movieId,
        rating,
        comment: movieComment || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al enviar calificación');
    }

    setUserRatings((prev) => ({ ...prev, [movieId]: rating }));
    showNotification('¡Calificación enviada exitosamente!');
    handleCloseModal(); // Cerrar modal después de enviar

    console.log('[Frontend] Rating sent successfully:', data);
  } catch (error) {
    console.error('[Frontend] Error submitting rating:', error);
    showNotification('Error al enviar calificación');
  }
};

const handleCloseModal = () => {
  setSelectedMovie(null);
  setMovieComment('');
  setTempRating(0);
};



  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  useEffect(() => {
    fetchRandomMovies();
  }, []);

 // Reemplaza tu componente StarRating con este:

const StyledStar = styled(Star)<{ $filled: boolean }>`
  transition: all 0.2s ease;
  fill: ${({ $filled }) => ($filled ? '#facc15' : 'none')};
  color: ${({ $filled }) => ($filled ? '#facc15' : '#64748b')};
  filter: ${({ $filled }) => ($filled ? 'drop-shadow(0 2px 4px rgba(250, 204, 21, 0.4))' : 'none')};
  transform: ${({ $filled }) => ($filled ? 'scale(1.1)' : 'scale(1)')};
`;

const StarRating = ({
  movieId,
  currentRating,
  mode = 'auto' // 'auto' para main grid, 'manual' para modal
}: {
  movieId: number;
  currentRating?: number;
  mode?: 'auto' | 'manual';
}) => {
  const [hover, setHover] = useState(0);

  // En modo 'auto' usa userRatings, en modo 'manual' usa tempRating
  const rating = mode === 'auto'
    ? (userRatings[movieId] || currentRating || 0)
    : (tempRating || currentRating || 0);

  const handleStarClick = (star: number) => {
    if (mode === 'auto') {
      // Modo automático: envía inmediatamente
      submitRating(movieId, star);
    } else {
      // Modo manual: solo guarda temporalmente
      setTempRating(star);
    }
  };

  return (
    <StarContainer>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hover || rating);

        return (
          <StarButton
            key={star}
            onClick={(e) => {
              e.stopPropagation();
              handleStarClick(star);
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          >
            <StyledStar
              size={22}
              $filled={isFilled}
            />
          </StarButton>
        );
      })}
    </StarContainer>
  );
};

 return (
  <Container>
    {/* Full-width background */}
    <div className="w-full">
      <Header>
        <HeaderContent>
          <Film className="text-blue-400" size={36} />
          <div>
            <Title>MovieStream</Title>
            <Subtitle>Descubre y califica las mejores películas</Subtitle>
          </div>
        </HeaderContent>
      </Header>
    </div>

    {notification && (
      <Notification>
        <ThumbsUp size={20} />
        {notification}
      </Notification>
    )}

    {/* Centered content */}
    <Main>
      <div className="flex justify-between items-center mb-8">
        <SectionTitle>Películas Aleatorias</SectionTitle>
        <RefreshButton onClick={() => fetchRandomMovies(7)} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Cargando...
            </>
          ) : (
            <>
              <RefreshCw size={20} />
              Cargar Nuevas
            </>
          )}
        </RefreshButton>
      </div>

      {loading ? (
        <LoaderWrapper>
          <Spinner size={48} />
        </LoaderWrapper>
      ) : (
        <MoviesGrid>
  {movies.map((movie) => (
    <MovieCard key={movie.id} onClick={() => setSelectedMovie(movie)}>
      <CardImage>
        <Film size={64} className="text-white/40" />
      </CardImage>
      <CardContent>
        <MovieTitle>{movie.title}</MovieTitle>
        <Tags>
          <Tag color="blue">{movie.year}</Tag>
          <Tag color="purple">{movie.genre}</Tag>
        </Tags>
        <Plot>{movie.plot}</Plot>
        <RatingLabel>Tu calificación:</RatingLabel>
        {/* Modo automático: envía al hacer clic */}
        <StarRating movieId={movie.id} currentRating={movie.rating} mode="auto" />
      </CardContent>
    </MovieCard>
  ))}
</MoviesGrid>
      )}
    </Main>

    {/* Modal remains full-screen */}
   {selectedMovie && (
  <ModalOverlay onClick={handleCloseModal}>
    <ModalContent onClick={(e) => e.stopPropagation()}>
      <ModalImage>
        <Film size={96} className="text-white/40" />
      </ModalImage>
      <ModalBody>
        <ModalTitle>{selectedMovie.title}</ModalTitle>
        <ModalTags>
          <Tag color="blue">{selectedMovie.year}</Tag>
          <Tag color="purple">{selectedMovie.genre}</Tag>
        </ModalTags>
        <SynopsisTitle>Sinopsis</SynopsisTitle>
        <Synopsis>{selectedMovie.plot}</Synopsis>
         <RatingLabel>Director: {selectedMovie.director}</RatingLabel>
        <RatingLabel>Califica esta película:</RatingLabel>
        {/* Modo manual: solo guarda, no envía */}
        <StarRating
          movieId={selectedMovie.id}
          currentRating={selectedMovie.rating}
          mode="manual"
        />

        <CommentSection>
          <CommentLabel htmlFor="movie-comment">
            Comentario (opcional)
          </CommentLabel>
          <CommentTextarea
            id="movie-comment"
            placeholder="Comparte tu opinión sobre esta película..."
            value={movieComment}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 200) {
                setMovieComment(value);
              }
            }}
            maxLength={200}
          />
          <CharacterCount $isNearLimit={movieComment.length >= 180}>
            {movieComment.length}/200 caracteres
          </CharacterCount>
        </CommentSection>

        <ButtonGroup>
          <CancelButton onClick={handleCloseModal}>
            Cancelar
          </CancelButton>
          <SubmitButton
            onClick={() => {
              if (tempRating > 0) {
                submitRating(selectedMovie.id, tempRating);
              } else {
                showNotification('Por favor, califica la película primero');
              }
            }}
            disabled={tempRating === 0}
          >
            Enviar Calificación
          </SubmitButton>
        </ButtonGroup>
      </ModalBody>
    </ModalContent>
  </ModalOverlay>
)}
  </Container>
);
}
