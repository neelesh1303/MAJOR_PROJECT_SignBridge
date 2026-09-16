import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const GRID_SIZE = 3;
const DEFAULT_TILE_SIZE = 100; // Default size for 300x300 image
const FALLBACK_IMAGE = '/letters/a.jpg'; // Fallback image

const PuzzleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
`;

const Board = styled.div`
  position: relative;
  border: 2px solid black;
  background-color: #fff;
  width: ${GRID_SIZE * DEFAULT_TILE_SIZE}px;
  height: ${GRID_SIZE * DEFAULT_TILE_SIZE}px;
  overflow: hidden;
`;

const Tile = styled.div`
  position: absolute;
  width: ${(props) => props.tileSize}px;
  height: ${(props) => props.tileSize}px;
  border: 1px solid #000;
  cursor: pointer;
  transition: all 0.2s ease;
  &.blank {
    background: #ccc;
    cursor: default;
  }
`;

const SolvedMessage = styled.h3`
  font-size: 1.5rem;
  color: #15803d;
  margin-top: 10px;
`;

const NewGameButton = styled.button`
  margin-top: 10px;
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s;
  &:hover {
    background-color: #0056b3;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  margin-top: 10px;
`;

const SolvePuzzle = () => {
  const [board, setBoard] = useState([...Array(GRID_SIZE * GRID_SIZE).keys()]);
  const [blankIndex, setBlankIndex] = useState(GRID_SIZE * GRID_SIZE - 1);
  const [solved, setSolved] = useState(false);
  const [imageSrc, setImageSrc] = useState(FALLBACK_IMAGE);
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);
  const [error, setError] = useState(null);

  // Load images and set size
  const loadRandomImage = () => {
    fetch('/ISL_Gifs.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load ISL_Gifs.json');
        return res.json();
      })
      .then((json) => {
        const validImages = json
          .filter((item) => item.gif || item.image)
          .map((item) => item.gif || item.image);
        if (validImages.length > 0) {
          const randomImage = validImages[Math.floor(Math.random() * validImages.length)];
          setImageSrc(randomImage);
          const img = new Image();
          img.src = randomImage;
          img.onload = () => {
            const size = Math.min(img.width, img.height) / GRID_SIZE;
            setTileSize(size);
            setError(null);
          };
          img.onerror = () => {
            setError(`Image ${randomImage} failed to load`);
            setTileSize(DEFAULT_TILE_SIZE);
          };
        } else {
          setError('No valid images found in ISL_Gifs.json');
          setImageSrc(FALLBACK_IMAGE);
          setTileSize(DEFAULT_TILE_SIZE);
        }
        shuffleBoard();
      })
      .catch((err) => {
        setError(`Error loading images: ${err.message}`);
        setImageSrc(FALLBACK_IMAGE);
        setTileSize(DEFAULT_TILE_SIZE);
        shuffleBoard();
      });
  };

  useEffect(() => {
    loadRandomImage();
  }, []);

  // Shuffle the board
  const shuffleBoard = () => {
    let newBoard = [...Array(GRID_SIZE * GRID_SIZE).keys()];
    let blank = GRID_SIZE * GRID_SIZE - 1;

    for (let i = 0; i < 1000; i++) {
      const moves = getPossibleMoves(blank);
      const move = moves[Math.floor(Math.random() * moves.length)];
      [newBoard[blank], newBoard[move]] = [newBoard[move], newBoard[blank]];
      blank = move;
    }

    setBoard(newBoard);
    setBlankIndex(blank);
    setSolved(false);
  };

  const getPossibleMoves = (blank) => {
    const moves = [];
    const row = Math.floor(blank / GRID_SIZE);
    const col = blank % GRID_SIZE;
    if (row > 0) moves.push(blank - GRID_SIZE); // Up
    if (row < GRID_SIZE - 1) moves.push(blank + GRID_SIZE); // Down
    if (col > 0) moves.push(blank - 1); // Left
    if (col < GRID_SIZE - 1) moves.push(blank + 1); // Right
    return moves;
  };

  const handleTileClick = (index) => {
    if (solved) return;
    const possibleMoves = getPossibleMoves(blankIndex);
    if (!possibleMoves.includes(index)) return;

    const newBoard = [...board];
    [newBoard[blankIndex], newBoard[index]] = [newBoard[index], newBoard[blankIndex]];
    setBoard(newBoard);
    setBlankIndex(index);

    if (newBoard.every((val, i) => val === i)) {
      setSolved(true);
    }
  };

  const getTileStyle = (tileNum, index) => {
    if (tileNum === GRID_SIZE * GRID_SIZE - 1) return { background: '#ccc' };
    const row = Math.floor(tileNum / GRID_SIZE);
    const col = tileNum % GRID_SIZE;
    return {
      backgroundImage: `url(${imageSrc})`,
      backgroundSize: `${GRID_SIZE * tileSize}px ${GRID_SIZE * tileSize}px`,
      backgroundPosition: `-${col * tileSize}px -${row * tileSize}px`,
      width: `${tileSize}px`,
      height: `${tileSize}px`,
      left: `${(index % GRID_SIZE) * tileSize}px`,
      top: `${Math.floor(index / GRID_SIZE) * tileSize}px`,
    };
  };

  return (
    <PuzzleContainer>
      <Board>
        {board.map((tileNum, index) => (
          <Tile
            key={index}
            tileSize={tileSize}
            className={tileNum === GRID_SIZE * GRID_SIZE - 1 ? 'blank' : ''}
            style={getTileStyle(tileNum, index)}
            onClick={() => handleTileClick(index)}
          />
        ))}
      </Board>
      {solved && <SolvedMessage>Puzzle Solved!</SolvedMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <NewGameButton onClick={loadRandomImage}>New Game</NewGameButton>
    </PuzzleContainer>
  );
};

export default SolvePuzzle;
