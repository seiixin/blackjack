import { useEffect, useMemo, useRef, useState } from 'react';

import gameboardBackground from '../assets/gameboard-background.png';
import lobbyBackground from '../assets/blackjack-lobby-background.png';
import tableFront from '../assets/table-front.png';
import tableLeft from '../assets/table-left.png';
import tableRight from '../assets/table-right.png';
import coinsBankImage from '../assets/character/coins.png';
import coinTier500 from '../assets/character/500-coins.png';
import coinTier15k from '../assets/character/15k-coins.png';
import coinTier100k from '../assets/character/100k-coins.png';
import coinTier500k from '../assets/character/500k-coins.png';
import coinTier1m from '../assets/character/1m-coins.png';
import standFront from '../assets/character/stand-front.png';
import walkRight1 from '../assets/character/walk-ad-frame-1.png';
import walkRight2 from '../assets/character/walk-ad-frame-2.png';
import walkRight3 from '../assets/character/walk-ad-frame-3.png';
import walkRight4 from '../assets/character/walk-ad-frame-4.png';
import walkRight5 from '../assets/character/walk-ad-frame-5.png';
import walkRight6 from '../assets/character/walk-ad-frame-6.png';
import walkUp1 from '../assets/character/walk-w-frame-1.png';
import walkUp2 from '../assets/character/walk-w-frame-2.png';
import walkUp3 from '../assets/character/walk-w-frame-3.png';
import walkUp4 from '../assets/character/walk-w-frame-4.png';
import walkDown1 from '../assets/character/walk-s-frame-1.png';
import walkDown2 from '../assets/character/walk-s-frame-2.png';
import walkDown3 from '../assets/character/walk-s-frame-3.png';
import walkDown4 from '../assets/character/walk-s-frame-4.png';

function useSpriteFrames(frames, delay = 140) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (frames.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setFrameIndex((currentIndex) => (currentIndex + 1) % frames.length);
    }, delay);

    return () => window.clearInterval(timer);
  }, [delay, frames]);

  return frames[frameIndex];
}

const bounds = {
  x: { min: 8, max: 92 },
  y: { min: 24, max: 96 },
};

const tableZones = {
  easy: { x: 18, y: 62, radius: 10 },
  moderate: { x: 82, y: 62, radius: 10 },
  hard: { x: 50, y: 88, radius: 11 },
};

const WALK_SPEED = 0.8;

function isBlocked(_nextPosition) {
  return false;
}

function getNearbyTable(position) {
  const entries = [
    { key: 'easy', label: 'Easy', ...tableZones.easy },
    { key: 'moderate', label: 'Moderate', ...tableZones.moderate },
    { key: 'hard', label: 'Hard', ...tableZones.hard },
  ];

  for (const entry of entries) {
    const distance = Math.hypot(position.x - entry.x, position.y - entry.y);
    if (distance <= entry.radius) {
      return entry;
    }
  }

  return null;
}

function getTableByKey(tableKey) {
  const tables = {
    easy: { key: 'easy', label: 'Easy', ...tableZones.easy },
    moderate: { key: 'moderate', label: 'Moderate', ...tableZones.moderate },
    hard: { key: 'hard', label: 'Hard', ...tableZones.hard },
  };

  return tables[tableKey] ?? null;
}

function createDeck() {
  const suits = ['S', 'H', 'D', 'C'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]];
  }

  return deck;
}

function handValue(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.rank === 'A') {
      total += 11;
      aces += 1;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function cardLabel(card) {
  return `${card.rank}${card.suit}`;
}

function cardImageUrl(card) {
  const suitNames = {
    S: 'spades',
    H: 'hearts',
    D: 'diamonds',
    C: 'clubs',
  };

  const rankNames = {
    A: 'ace',
    J: 'jack',
    Q: 'queen',
    K: 'king',
  };

  const rankName = rankNames[card.rank] ?? card.rank;
  return `https://raw.githubusercontent.com/hayeah/playing-cards-assets/master/png/${rankName}_of_${suitNames[card.suit]}.png`;
}

function suitGlyph(suit) {
  return {
    S: '♠',
    H: '♥',
    D: '♦',
    C: '♣',
  }[suit] ?? suit;
}

function createRound(difficulty) {
  const deck = createDeck();
  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];

  return {
    difficulty,
    deck,
    playerHand,
    dealerHand,
    status: 'player-turn',
    message: 'Choose Hit or Stand.',
    wager: null,
    hasDoubled: false,
  };
}

function getCoinArt(balance) {
  if (balance >= 1000000) return { src: coinTier1m, label: '1M+', badge: 'mythic' };
  if (balance >= 500000) return { src: coinTier500k, label: '500k+', badge: 'epic' };
  if (balance >= 100000) return { src: coinTier100k, label: '100k+', badge: 'rare' };
  if (balance >= 15000) return { src: coinTier15k, label: '15k+', badge: 'uncommon' };
  return { src: coinTier500, label: '500', badge: 'starter' };
}

function scheduleTableReset(setTablePhase, setRound, setBetInput) {
  window.setTimeout(() => {
    setTablePhase('bet');
    setRound(null);
    setBetInput('500');
  }, 1800);
}

function CardFace({ card }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    const isRed = card.suit === 'H' || card.suit === 'D';
    return (
      <div className="flex h-full w-full flex-col justify-between rounded-[0.55rem] bg-white p-2 text-[11px] font-semibold shadow-[0_10px_18px_rgba(0,0,0,0.35)]">
        <div className={`leading-none ${isRed ? 'text-red-600' : 'text-black'}`}>
          <div>{card.rank}</div>
          <div>{suitGlyph(card.suit)}</div>
        </div>
        <div className={`self-end text-lg leading-none ${isRed ? 'text-red-600' : 'text-black'}`}>{suitGlyph(card.suit)}</div>
      </div>
    );
  }

  return (
    <img
      src={cardImageUrl(card)}
      alt={cardLabel(card)}
      className="h-full w-full object-contain p-1.5"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function App() {
  const walkRightFrames = useMemo(
    () => [walkRight1, walkRight2, walkRight3, walkRight4, walkRight5, walkRight6],
    [],
  );
  const walkUpFrames = useMemo(() => [walkUp1, walkUp2, walkUp3, walkUp4], []);
  const walkDownFrames = useMemo(() => [walkDown1, walkDown2, walkDown3, walkDown4], []);
  const [activeMove, setActiveMove] = useState('idle');
  const [direction, setDirection] = useState('right');
  const [position, setPosition] = useState({ x: 50.5, y: 26 });
  const [isWalking, setIsWalking] = useState(false);
  const [pressedKeys, setPressedKeys] = useState({ left: false, right: false, up: false, down: false });
  const [actionMessage, setActionMessage] = useState('');
  const [activeTable, setActiveTable] = useState(null);
  const [tablePhase, setTablePhase] = useState('bet');
  const [round, setRound] = useState(null);
  const [coins, setCoins] = useState(10000000);
  const [betInput, setBetInput] = useState('500');
  const [winCount, setWinCount] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [loseCount, setLoseCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0, active: false });
  const positionRef = useRef(position);
  const nearbyTableRef = useRef(null);
  const coinsRef = useRef(10000000);
  const walkRightImage = useSpriteFrames(walkRightFrames, 120);
  const walkUpImage = useSpriteFrames(walkUpFrames, 120);
  const walkDownImage = useSpriteFrames(walkDownFrames, 120);
  const nearbyTable = getNearbyTable(position);
  const currentTableZone = activeTable ? getTableByKey(activeTable) : nearbyTable;
  const liveBetAmount = Number(betInput.replace(/[^0-9]/g, '')) || 0;
  const betCoinArt = getCoinArt(liveBetAmount || 500);
  const difficultyMeta = {
    easy: {
      title: 'Easy Table',
      subtitle: 'Low stakes, simple pace.',
      accent: 'from-emerald-400/35 to-emerald-700/15',
      dealerStand: 15,
    },
    moderate: {
      title: 'Moderate Table',
      subtitle: 'Balanced table, standard risk.',
      accent: 'from-amber-300/35 to-amber-700/15',
      dealerStand: 16,
    },
    hard: {
      title: 'Hard Table',
      subtitle: 'High tension, high reward.',
      accent: 'from-rose-400/35 to-rose-700/15',
      dealerStand: 17,
    },
  };

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    coinsRef.current = coins;
  }, [coins]);

  useEffect(() => {
    nearbyTableRef.current = getNearbyTable(position);
  }, [position]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const updateMobile = () => setIsMobile(media.matches);
    updateMobile();
    media.addEventListener('change', updateMobile);
    return () => media.removeEventListener('change', updateMobile);
  }, []);

  useEffect(() => {
    if (!round || round.status !== 'player-win') {
      setWinCount(0);
      setShowWinModal(false);
      return undefined;
    }

    setShowWinModal(true);
    const targetAmount = (round.wager ?? 0) * 2;
    let currentAmount = 0;
    const step = Math.max(1, Math.ceil(targetAmount / 45));

    setWinCount(0);

    const timer = window.setInterval(() => {
      currentAmount = Math.min(targetAmount, currentAmount + step);
      setWinCount(currentAmount);

      if (currentAmount >= targetAmount) {
        window.clearInterval(timer);
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, [round?.status, round?.wager]);

  useEffect(() => {
    if (!round || (round.status !== 'dealer-win' && round.status !== 'player-bust')) {
      setLoseCount(0);
      setShowLoseModal(false);
      return undefined;
    }

    setShowLoseModal(true);
    const targetAmount = round.wager ?? 0;
    let currentAmount = 0;
    const step = Math.max(1, Math.ceil(targetAmount / 45));

    setLoseCount(0);

    const timer = window.setInterval(() => {
      currentAmount = Math.min(targetAmount, currentAmount + step);
      setLoseCount(currentAmount);

      if (currentAmount >= targetAmount) {
        window.clearInterval(timer);
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, [round?.status, round?.wager]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        setPressedKeys((currentKeys) => ({ ...currentKeys, left: true }));
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        setPressedKeys((currentKeys) => ({ ...currentKeys, right: true }));
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        setPressedKeys((currentKeys) => ({ ...currentKeys, up: true }));
      }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        setPressedKeys((currentKeys) => ({ ...currentKeys, down: true }));
      }
      if (event.key.toLowerCase() === 'e') {
        const currentNearbyTable = nearbyTableRef.current;
        if (!currentNearbyTable) return;
        setActiveTable(currentNearbyTable.key);
        setActionMessage('');
        setTablePhase('bet');
        setRound(null);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        setPressedKeys((currentKeys) => ({ ...currentKeys, left: false }));
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        setPressedKeys((currentKeys) => ({ ...currentKeys, right: false }));
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        setPressedKeys((currentKeys) => ({ ...currentKeys, up: false }));
      }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        setPressedKeys((currentKeys) => ({ ...currentKeys, down: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPosition((currentPosition) => {
        let nextX = currentPosition.x;
        let nextY = currentPosition.y;
        let walking = false;

        if (pressedKeys.left && !pressedKeys.right) {
          nextX = Math.max(bounds.x.min, currentPosition.x - WALK_SPEED);
          setDirection('left');
          setActiveMove('right');
          walking = true;
        }

        if (pressedKeys.right && !pressedKeys.left) {
          nextX = Math.min(bounds.x.max, currentPosition.x + WALK_SPEED);
          setDirection('right');
          setActiveMove('right');
          walking = true;
        }

        if (pressedKeys.up && !pressedKeys.down) {
          nextY = Math.max(bounds.y.min, currentPosition.y - WALK_SPEED);
          setActiveMove('up');
          walking = true;
        }

        if (pressedKeys.down && !pressedKeys.up) {
          nextY = Math.min(bounds.y.max, currentPosition.y + WALK_SPEED);
          setActiveMove('down');
          walking = true;
        }

        const attemptedPosition = { x: nextX, y: nextY };
        if (isBlocked(attemptedPosition)) {
          return currentPosition;
        }

        if (!walking) {
          setActiveMove('idle');
        }

        setIsWalking(walking);
        return { x: nextX, y: nextY };
      });
    }, 16);

    return () => window.clearInterval(timer);
  }, [pressedKeys]);

  const tableMeta = activeTable ? difficultyMeta[activeTable] : null;
  const doubleCost = round?.status === 'player-turn' ? (round.wager ?? 0) : 0;
  const canDouble = !!round && round.status === 'player-turn' && !round.hasDoubled && coins >= doubleCost;
  const doubleShortfall = canDouble ? 0 : Math.max(0, doubleCost - coins);

  const dealRound = () => {
    if (!activeTable) return;
    const wager = Math.max(1, liveBetAmount || Math.max(5, difficultyMeta[activeTable].dealerStand - 10));
    const currentCoins = coinsRef.current;

    if (currentCoins < wager) {
      return;
    }

    coinsRef.current = currentCoins - wager;
    setCoins(currentCoins - wager);
    setTablePhase('game');
    setRound({
      ...createRound(activeTable),
      wager,
    });
  };

  const hit = () => {
    setRound((currentRound) => {
      if (!currentRound || currentRound.status !== 'player-turn') return currentRound;
      const nextDeck = [...currentRound.deck];
      const nextPlayerHand = [...currentRound.playerHand, nextDeck.pop()];
      const nextPlayerTotal = handValue(nextPlayerHand);

      if (nextPlayerTotal > 21) {
        scheduleTableReset(setTablePhase, setRound, setBetInput);
      return {
        ...currentRound,
        deck: nextDeck,
        playerHand: nextPlayerHand,
        status: 'player-bust',
        message: 'You busted. Dealer wins.',
        };
      }

      return {
        ...currentRound,
        deck: nextDeck,
        playerHand: nextPlayerHand,
        message: 'Hit or stand?',
      };
    });
  };

  const stand = () => {
    setRound((currentRound) => {
      if (!currentRound || currentRound.status !== 'player-turn') return currentRound;

      const nextDeck = [...currentRound.deck];
      const nextDealerHand = [...currentRound.dealerHand];
      const dealerStand = difficultyMeta[currentRound.difficulty].dealerStand;
      let dealerTotal = handValue(nextDealerHand);

      while (dealerTotal < dealerStand) {
        nextDealerHand.push(nextDeck.pop());
        dealerTotal = handValue(nextDealerHand);
      }

      const playerTotal = handValue(currentRound.playerHand);
      let message = 'Push.';
      let status = 'push';
      const wager = currentRound.wager ?? 0;

      if (dealerTotal > 21 || playerTotal > dealerTotal) {
        message = 'You win!';
        status = 'player-win';
        coinsRef.current += wager * 2;
        setCoins((currentCoins) => currentCoins + wager * 2);
        scheduleTableReset(setTablePhase, setRound, setBetInput);
      } else if (playerTotal < dealerTotal) {
        message = 'Dealer wins.';
        status = 'dealer-win';
        scheduleTableReset(setTablePhase, setRound, setBetInput);
      } else {
        coinsRef.current += wager;
        setCoins((currentCoins) => currentCoins + wager);
        scheduleTableReset(setTablePhase, setRound, setBetInput);
      }

      return {
        ...currentRound,
        deck: nextDeck,
        dealerHand: nextDealerHand,
        status,
        message,
      };
    });
  };

  const doubleBet = () => {
    setRound((currentRound) => {
      if (!currentRound || currentRound.status !== 'player-turn') return currentRound;

      const currentWager = currentRound.wager ?? 0;
      const doubleAmount = currentWager;
      const currentCoins = coinsRef.current;

      if (currentCoins < doubleAmount) {
        return currentRound;
      }

      const nextWager = currentWager + doubleAmount;
      const nextDeck = [...currentRound.deck];
      const nextPlayerHand = [...currentRound.playerHand, nextDeck.pop()];
      const nextPlayerTotal = handValue(nextPlayerHand);

      coinsRef.current = currentCoins - doubleAmount;
      setCoins(currentCoins - doubleAmount);

      if (nextPlayerTotal > 21) {
        scheduleTableReset(setTablePhase, setRound, setBetInput);
        return {
          ...currentRound,
          deck: nextDeck,
          playerHand: nextPlayerHand,
          wager: nextWager,
          hasDoubled: true,
          status: 'player-bust',
          message: 'You busted. Dealer wins.',
        };
      }

      return {
        ...currentRound,
        deck: nextDeck,
        playerHand: nextPlayerHand,
        wager: nextWager,
        hasDoubled: true,
        message: `Double accepted. Bet is now ${nextWager.toLocaleString()}.`,
      };
    });
  };

  const enterNearbyTable = () => {
    const currentNearbyTable = nearbyTableRef.current;
    if (!currentNearbyTable) return;
    setActiveTable(currentNearbyTable.key);
    setActionMessage('');
    setTablePhase('bet');
    setRound(null);
  };

  const setJoystickMove = (dx, dy) => {
    const magnitude = Math.hypot(dx, dy);
    if (magnitude < 12) {
      setJoystick({ x: 0, y: 0, active: true });
      setPressedKeys((currentKeys) => ({
        ...currentKeys,
        left: false,
        right: false,
        up: false,
        down: false,
      }));
      return;
    }

    const normX = dx / magnitude;
    const normY = dy / magnitude;
    const nextKeys = {
      left: normX < -0.35,
      right: normX > 0.35,
      up: normY < -0.35,
      down: normY > 0.35,
    };

    setJoystick({
      x: Math.max(-24, Math.min(24, dx)),
      y: Math.max(-24, Math.min(24, dy)),
      active: true,
    });
    setPressedKeys((currentKeys) => ({ ...currentKeys, ...nextKeys }));
  };

  const clearJoystickMove = () => {
    setJoystick({ x: 0, y: 0, active: false });
    setPressedKeys((currentKeys) => ({
      ...currentKeys,
      left: false,
      right: false,
      up: false,
      down: false,
    }));
  };

  if (activeTable && tableMeta) {
    const playerTotal = round ? handValue(round.playerHand) : 0;
    const dealerTotal = round ? handValue(round.dealerHand) : 0;
    const coinArt = getCoinArt(coins);

    return (
      <main className="relative min-h-screen overflow-hidden bg-black text-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${gameboardBackground})` }}
        />
        <div className="absolute inset-0 bg-black/40" />

        <section className="relative flex min-h-screen items-stretch px-3 py-3 sm:px-6 sm:py-6">
          <div className="grid min-h-[calc(100svh-1.5rem)] w-full gap-3 xl:grid-cols-[minmax(0,1.45fr)_420px]">
            {/* Left panel — gameboard with floating cards */}
            <div className="relative min-h-[42svh] overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:rounded-[2rem]">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${gameboardBackground})` }}
              />
              <div className="absolute inset-0 bg-black/30" />

              {/* Bet coin — always visible, animates on tier change */}
              <div className="absolute bottom-[10%] left-0 right-0 flex items-center justify-center pointer-events-none gap-3 px-4">
                {/* Double coin — lalabas lang kapag nag-double */}
                {round?.wager && round.wager > (liveBetAmount || 500) ? (
                  <img
                    key={`double-${betCoinArt.badge}`}
                    src={betCoinArt.src}
                    alt={betCoinArt.label}
                    className="coin-slide-in h-20 w-20 object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] -rotate-12 sm:h-28 sm:w-28"
                  />
                ) : null}
                <img
                  key={betCoinArt.badge}
                  src={betCoinArt.src}
                  alt={betCoinArt.label}
                  className="coin-pop h-24 w-24 object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] sm:h-32 sm:w-32"
                />
              </div>

              {/* Cards — dealer dead center, player pinaka-baba */}
              {tablePhase === 'game' && round ? (
                <div className="absolute inset-0">

                  {/* Dealer cards — dead center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-wrap justify-center gap-2 px-3">
                      {round.dealerHand.map((card, i) => (
                        <div
                          key={i}
                          className="card-deal-down h-24 w-16 overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.6)] sm:h-28 sm:w-20"
                          style={{ animationDelay: `${i * 120}ms` }}
                        >
                          <CardFace card={card} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 xl:hidden">
                    <div className="rounded-2xl border border-white/12 bg-black/55 px-3 py-2 backdrop-blur-md">
                      <p className="text-[8px] uppercase tracking-[0.45em] text-white/35">Dealer</p>
                      <p className="mt-1 text-sm font-bold tabular-nums text-white">{dealerTotal}</p>
                    </div>
                    <div className="rounded-2xl border border-white/12 bg-black/55 px-3 py-2 backdrop-blur-md">
                      <p className="text-[8px] uppercase tracking-[0.45em] text-white/35">You</p>
                      <p className="mt-1 text-sm font-bold tabular-nums text-white">{playerTotal}</p>
                    </div>
                  </div>

                  {/* Player cards — pinaka-baba */}
                  <div className="absolute bottom-4 left-0 right-0 flex flex-wrap justify-center gap-2 px-3 sm:bottom-8">
                    {round.playerHand.map((card, i) => (
                      <div
                        key={i}
                        className="card-deal-up h-24 w-16 overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.6)] sm:h-28 sm:w-20"
                        style={{ animationDelay: `${i * 120 + 80}ms` }}
                      >
                        <CardFace card={card} />
                      </div>
                    ))}
                  </div>

                </div>
              ) : null}

              <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 xl:hidden">
                <div className="min-w-0 rounded-2xl border border-white/12 bg-black/55 px-3 py-2 backdrop-blur-md">
                  <p className="text-[8px] uppercase tracking-[0.45em] text-white/35">Wallet</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-white">{coins.toLocaleString()}</p>
                </div>
              </div>

              {tablePhase === 'bet' ? (
                <div className="absolute inset-x-0 top-20 z-20 px-3 xl:hidden">
                  <div className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-[1.25rem] border border-white/12 bg-black/60 p-3 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <img src={coinArt.src} alt={coinArt.label} className="h-9 w-9 shrink-0 object-contain" />
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.45em] text-white/35">Wallet</p>
                        <p className="mt-1 text-sm font-bold tabular-nums text-white">{coins.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                      <p className="text-[9px] uppercase tracking-[0.5em] text-white/30">Your Bet</p>
                      <div className="mt-3 flex items-center gap-3">
                        <img key={betCoinArt.badge} src={betCoinArt.src} alt={betCoinArt.label} className="h-9 w-9 shrink-0 object-contain" />
                        <input
                          value={betInput}
                          onChange={(e) => setBetInput(e.target.value)}
                          inputMode="numeric"
                          className="w-full bg-transparent text-2xl font-black tabular-nums text-white outline-none placeholder:text-white/15"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                      <p className="text-[9px] uppercase tracking-[0.5em] text-white/30">Coin Bank</p>
                      <img src={coinsBankImage} alt="Coin tiers" className="mt-2 w-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={dealRound}
                      className="w-full rounded-2xl bg-white py-3 text-sm font-bold text-black transition active:scale-[0.98]"
                    >
                      Deal Round
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTable(null); setTablePhase('bet'); setRound(null); }}
                      className="w-full rounded-2xl border border-white/15 bg-black/35 py-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/70"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              ) : null}

              {tablePhase === 'game' ? (
                <div className="absolute inset-x-0 bottom-3 z-20 px-3 xl:hidden">
                  <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={doubleBet}
                      disabled={!canDouble}
                      className="rounded-2xl border border-white/15 bg-black px-2 py-3 text-xs font-semibold text-white/85 disabled:opacity-25"
                    >
                      Double
                    </button>
                    <button
                      type="button"
                      onClick={hit}
                      disabled={round?.status !== 'player-turn'}
                      className="rounded-2xl bg-black px-2 py-3 text-xs font-bold text-white disabled:opacity-30"
                    >
                      Hit
                    </button>
                    <button
                      type="button"
                      onClick={stand}
                      disabled={round?.status !== 'player-turn'}
                      className="rounded-2xl border border-white/20 bg-black px-2 py-3 text-xs font-semibold text-white disabled:opacity-30"
                    >
                      Stand
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="hidden h-full max-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0d0d0d] shadow-[0_30px_100px_rgba(0,0,0,0.7)] sm:rounded-[2rem] xl:flex">

              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-white/8">
                <p className="text-[10px] uppercase tracking-[0.7em] text-white/30 mb-1">Game Panel</p>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold text-white sm:text-2xl">{tableMeta.title}</h2>
                    <p className="mt-1 text-sm text-white/45">{tableMeta.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActiveTable(null); setTablePhase('bet'); setRound(null); }}
                    className="shrink-0 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-medium text-white/60 transition hover:bg-white/15 hover:text-white/90"
                  >
                    Leave
                  </button>
                </div>

                {/* Wallet */}
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5">
                  <img src={coinArt.src} alt={coinArt.label} className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-white/30">Wallet</p>
                    <p className="text-xl font-bold tabular-nums text-white leading-tight">{coins.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">

                {tablePhase === 'bet' ? (
                  <>
                    {/* Bet input */}
                    <div className="rounded-2xl bg-white/5 border border-white/8 p-4">
                      <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 mb-3">Your Bet</p>
                      <div className="flex items-center gap-3">
                        <img key={betCoinArt.badge} src={betCoinArt.src} alt={betCoinArt.label} className="coin-pop h-14 w-14 shrink-0 object-contain" />
                        <input
                          value={betInput}
                          onChange={(e) => setBetInput(e.target.value)}
                          inputMode="numeric"
                          className="flex-1 bg-transparent text-3xl font-black tabular-nums text-white outline-none placeholder:text-white/15 sm:text-4xl"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Coin bank */}
                    <div className="rounded-2xl bg-white/5 border border-white/8 p-4">
                      <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 mb-3">Coin Bank</p>
                      <img src={coinsBankImage} alt="Coin tiers" className="w-full object-contain" />
                    </div>

                    {/* Deal button */}
                    <button
                      type="button"
                      onClick={dealRound}
                      className="w-full rounded-2xl bg-white text-black font-bold text-base py-4 transition hover:bg-white/90 active:scale-[0.98]"
                    >
                      Deal Round
                    </button>
                  </>
                ) : (
                  <>
                    {/* Score board */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/5 border border-white/8 p-4 text-center">
                        <p className="text-[9px] uppercase tracking-[0.5em] text-white/30 mb-1">Dealer</p>
                        <p className="text-4xl font-black tabular-nums text-white sm:text-5xl">{dealerTotal}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 border border-white/8 p-4 text-center">
                        <p className="text-[9px] uppercase tracking-[0.5em] text-white/30 mb-1">You</p>
                        <p className="text-4xl font-black tabular-nums text-white sm:text-5xl">{playerTotal}</p>
                      </div>
                    </div>

                    {/* Status / message */}
                    <div className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-white/50 text-center">
                      {round?.message ?? 'Deal cards to start the round.'}
                    </div>

                    {/* Wager indicator */}
                    {round?.wager ? (
                      <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/8 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">Current Wager</p>
                        <p className="text-base font-bold tabular-nums text-white">{round.wager.toLocaleString()}</p>
                      </div>
                    ) : null}

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={doubleBet}
                        disabled={!canDouble}
                        className="flex flex-col items-center justify-center rounded-2xl border border-white/15 bg-black py-4 text-sm font-semibold text-white/80 transition hover:bg-black/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <span>Double</span>
                        {!canDouble && doubleCost > 0 ? (
                          <span className="mt-0.5 text-[9px] uppercase tracking-wider text-white/25">
                            -{doubleShortfall.toLocaleString()}
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={hit}
                        disabled={round?.status !== 'player-turn'}
                        className="rounded-2xl bg-black text-white font-bold text-sm py-4 transition hover:bg-black/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Hit
                      </button>
                      <button
                        type="button"
                        onClick={stand}
                        disabled={round?.status !== 'player-turn'}
                        className="rounded-2xl border border-white/20 bg-black text-white font-semibold text-sm py-4 transition hover:bg-black/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Stand
                      </button>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        </section>

      {round?.status === 'push' ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="win-modal relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/15 bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(8,8,8,0.98))] p-5 text-center shadow-[0_30px_120px_rgba(0,0,0,0.9)] sm:rounded-[2rem] sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.8em] text-white/30">RESULT</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-white/90 sm:text-5xl">Push</h2>
            <p className="mt-2 text-sm text-white/45">It's a draw — your bet is returned.</p>
            <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/40 px-5 py-4">
              <span className="block text-xs uppercase tracking-[0.55em] text-white/30">Returned</span>
              <span className="mt-2 block text-4xl font-black tabular-nums text-white/80 sm:text-5xl">
                {(round.wager ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {showWinModal && round?.status === 'player-win' ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
            <div className="win-modal relative w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-amber-300/35 bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(0,0,0,0.98))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.8)] sm:rounded-[2rem] sm:p-6">
              <div className="absolute inset-0 sparkle-layer" />
              <div className="absolute -left-10 top-6 text-5xl coin-float">🪙</div>
              <div className="absolute right-6 top-8 text-4xl coin-float delay-1">🪙</div>
              <div className="absolute bottom-8 left-10 text-3xl coin-float delay-2">🪙</div>
              <div className="absolute bottom-10 right-10 text-5xl coin-float delay-3">🪙</div>

              <div className="relative rounded-[1.5rem] border border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,215,120,0.08),rgba(0,0,0,0.25))] p-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.8em] text-amber-200/80">WIN</p>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-amber-50 sm:text-5xl">Congratulations</h2>
                <p className="mt-2 text-sm text-amber-100/75">You won</p>
                <div className="mt-5 rounded-[1.25rem] border-2 border-amber-300/70 bg-black/55 px-5 py-4">
                  <span className="block text-xs uppercase tracking-[0.55em] text-amber-200/70">Payout</span>
                  <span className="mt-2 block text-5xl font-black tabular-nums text-amber-50 sm:text-6xl">
                    {winCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
        </div>
      ) : null}

      {showLoseModal && (round?.status === 'dealer-win' || round?.status === 'player-bust') ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <div className="win-modal relative w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(4,4,4,0.99),rgba(0,0,0,0.99))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.95)] sm:rounded-[2rem] sm:p-6">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
            </div>

            <div className="relative rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.28))] p-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.8em] text-white/30">LOSE</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-white/92 sm:text-5xl">Round Lost</h2>
              <p className="mt-2 text-sm text-white/55">You lost</p>
              <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/65 px-5 py-4">
                <span className="block text-xs uppercase tracking-[0.55em] text-white/30">Loss</span>
                <span className="mt-2 block text-5xl font-black tabular-nums text-white/90 sm:text-6xl">
                  -{loseCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

  // World / lobby view
  const coinArt = getCoinArt(coins);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Gameboard background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${lobbyBackground})` }}
      />
      {/* Dark overlay for depth */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Coin display */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-2 backdrop-blur-md sm:left-4 sm:top-4">
        <img src={coinArt.src} alt={coinArt.label} className="h-9 w-9 object-contain" />
        <div className="leading-tight">
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/50">Coins</p>
          <p className="text-sm font-semibold text-white">{coins.toLocaleString()}</p>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-[10px] uppercase tracking-[0.4em] text-white/50 backdrop-blur-md">
        {isMobile ? 'Tap table or use controls' : 'WASD / Arrow Keys to move · E to enter table'}
      </div>

      {isMobile ? (
        <div className="absolute inset-x-0 bottom-3 z-20 flex items-end justify-between px-3">
          <div
            className="relative h-32 w-32 rounded-full border border-white/12 bg-black/75 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md touch-none"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              const rect = event.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              setJoystickMove(event.clientX - centerX, event.clientY - centerY);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              setJoystickMove(event.clientX - centerX, event.clientY - centerY);
            }}
            onPointerUp={clearJoystickMove}
            onPointerCancel={clearJoystickMove}
            onPointerLeave={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) return;
              clearJoystickMove();
            }}
          >
            <div className="absolute inset-0 rounded-full border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_56%)]" />
            <div className="absolute left-1/2 top-2 -translate-x-1/2 text-lg font-black text-white/80">↑</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg font-black text-white/80">↓</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-lg font-black text-white/80">←</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-lg font-black text-white/80">→</div>
            <div
              className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-white/20 bg-black/60 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.35)] transition-transform duration-75"
              style={{
                transform: `translate(-50%, -50%) translate(${joystick.x}px, ${joystick.y}px)`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={enterNearbyTable}
            className="mb-2 h-20 w-20 rounded-full border border-emerald-300/30 bg-black/80 text-[11px] font-bold uppercase tracking-[0.35em] text-emerald-100 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md active:scale-95"
          >
            E
          </button>
        </div>
      ) : null}

      {/* World container */}
      <div className="relative h-screen w-full">
        {/* Table zones — Easy (left) */}
        <button
          type="button"
          className="absolute"
          onClick={() => setActiveTable('easy')}
          style={{ left: `${tableZones.easy.x}%`, top: `${tableZones.easy.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <img
            src={tableLeft}
            alt="Easy table"
            className="w-48 select-none object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] sm:w-72"
          />
        </button>

        {/* Table zones — Moderate (right) */}
        <button
          type="button"
          className="absolute"
          onClick={() => setActiveTable('moderate')}
          style={{ left: isMobile ? '72%' : `${tableZones.moderate.x}%`, top: `${tableZones.moderate.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <img
            src={tableRight}
            alt="Moderate table"
            className="w-80 select-none object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] sm:w-72"
          />
        </button>

        {/* Table zones — Hard (center bottom) */}
        <button
          type="button"
          className="absolute"
          onClick={() => setActiveTable('hard')}
          style={{ left: `${tableZones.hard.x}%`, top: `${tableZones.hard.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <img
            src={tableFront}
            alt="Hard table"
            className="w-56 select-none object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] sm:w-80"
          />
        </button>

        {/* Nearby table prompt */}
        {nearbyTable && (
          <div
            className="absolute z-20"
            style={{ left: `${position.x}%`, top: `${position.y - 16}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="rounded-full border border-white/25 bg-black/70 px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-white/80 backdrop-blur-sm">
              Press E · {nearbyTable.label}
            </div>
          </div>
        )}

        {/* Player character */}
        <div
          className="absolute z-10"
          style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className={`spawn-avatar relative h-44 w-44 sm:h-56 sm:w-56 ${isWalking ? 'walking' : ''}`}>
            <img
              src={
                activeMove === 'up'
                  ? walkUpImage
                  : activeMove === 'down'
                    ? walkDownImage
                    : activeMove === 'right'
                      ? walkRightImage
                      : standFront
              }
              alt="Player character"
              className={`h-full w-full select-none object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)] ${direction === 'left' ? 'scale-x-[-1]' : ''}`}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
