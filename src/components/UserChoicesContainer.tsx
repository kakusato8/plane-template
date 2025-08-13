import React from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import UserChoiceCard from './UserChoiceCard';
import { theme } from '../styles/theme';
import type { UserChoice } from '../../types/trivia';

interface UserChoicesContainerProps {
  choices: UserChoice[];
  onSelect: (choice: UserChoice) => void;
  className?: string;
}

const Container = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: 10;
  padding: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[4]};
  }
`;

const Title = styled(motion.h2)`
  color: white;
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes.xl};
  font-weight: ${theme.typography.weights.semibold};
  text-align: center;
  margin-bottom: ${theme.spacing[4]};
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.lg};
    margin-bottom: ${theme.spacing[3]};
  }
`;

const ChoicesGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing[4]};
  width: 100%;
  max-width: 1000px;

  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing[3]};
    max-width: 400px;
  }
`;


const UserChoicesContainer: React.FC<UserChoicesContainerProps> = ({
  choices,
  onSelect,
  className
}) => {
  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 1.05,
      transition: {
        duration: 0.3
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.1
      }
    }
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  return (
    <Container
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Title variants={titleVariants}>
        どちらへ向かいますか？
      </Title>

      <ChoicesGrid variants={gridVariants}>
        <AnimatePresence>
          {choices.map((choice, index) => (
            <UserChoiceCard
              key={choice.id}
              choice={choice}
              onSelect={onSelect}
              index={index}
            />
          ))}
        </AnimatePresence>
      </ChoicesGrid>
    </Container>
  );
};

export default UserChoicesContainer;