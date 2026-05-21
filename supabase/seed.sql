-- ════════════════════════════════════════════════════════════════
-- FITQUEST — SEED DATA
-- Execute por último (depois de schema.sql e rls.sql)
-- ════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- CONQUISTAS (ACHIEVEMENTS)
-- ════════════════════════════════════════════════════════════════

INSERT INTO achievements (slug, name, description, icon, category, xp_reward, rarity, trigger_type, trigger_value) VALUES
-- Fitness
('first_habit', 'Primeira Missão', 'Registrou seu primeiro hábito', '🎯', 'fitness', 100, 'common', 'first', 1),
('first_workout', 'Sangue, Suor e Dados', 'Completou seu primeiro treino', '💪', 'fitness', 100, 'common', 'first', 1),
('workouts_10', 'Constância', 'Completou 10 treinos', '🏋️', 'fitness', 200, 'common', 'count', 10),
('workouts_50', 'Disciplinado', 'Completou 50 treinos', '🔱', 'fitness', 500, 'rare', 'count', 50),
('workouts_100', 'Máquina', 'Completou 100 treinos', '🤖', 'fitness', 1000, 'rare', 'count', 100),
('workouts_365', 'Iron Will', 'Completou 365 treinos (1 por dia em média)', '👑', 'fitness', 5000, 'legendary', 'count', 365),
('first_pr', 'Limite Quebrado', 'Bateu seu primeiro Personal Record', '🏆', 'fitness', 150, 'common', 'first', 1),

-- Streak
('streak_3', 'Acendendo a Chama', '3 dias consecutivos de atividade', '✨', 'streak', 100, 'common', 'streak', 3),
('streak_7', 'Fogo Aceso', '7 dias consecutivos', '🔥', 'streak', 300, 'common', 'streak', 7),
('streak_30', 'Mês Implacável', '30 dias consecutivos', '🌋', 'streak', 1000, 'rare', 'streak', 30),
('streak_90', 'Sem Escusa', '90 dias consecutivos', '⚡', 'streak', 3000, 'epic', 'streak', 90),
('streak_180', 'Lenda Viva', '180 dias consecutivos', '💎', 'streak', 7000, 'legendary', 'streak', 180),
('streak_365', 'FitQuest Master', '365 dias consecutivos', '👁️', 'streak', 15000, 'legendary', 'streak', 365),

-- Dias Perfeitos
('perfect_day', 'Dia Perfeito', 'Todos os hábitos do dia concluídos', '⭐', 'fitness', 200, 'common', 'first', 1),
('perfect_week', 'Semana Impecável', '7 dias perfeitos consecutivos', '🌟', 'fitness', 1500, 'epic', 'count', 7),

-- Produtividade
('first_task', 'Início Organizado', 'Concluiu sua primeira tarefa', '✅', 'productivity', 100, 'common', 'first', 1),
('tasks_50', 'Executor', 'Concluiu 50 tarefas', '⚙️', 'productivity', 300, 'common', 'count', 50),
('tasks_200', 'Produtividade Brutal', 'Concluiu 200 tarefas', '🚀', 'productivity', 1000, 'rare', 'count', 200),

-- Finanças
('first_transaction', 'Sob Controle', 'Registrou sua primeira transação', '💵', 'finance', 50, 'common', 'first', 1),
('finance_goal_completed', 'Meta Cumprida', 'Bateu sua primeira meta financeira', '💰', 'finance', 500, 'rare', 'first', 1),
('zero_debt', 'Liberdade Financeira', '30 dias sem nenhuma conta atrasada', '🦅', 'finance', 800, 'rare', 'count', 30),

-- Levels
('level_2', 'Dedicado', 'Alcançou o Level 2', '🥉', 'level', 50, 'common', 'milestone', 2),
('level_3', 'Consistente', 'Alcançou o Level 3', '🥈', 'level', 100, 'common', 'milestone', 3),
('level_4', 'Atleta', 'Alcançou o Level 4', '🥇', 'level', 200, 'rare', 'milestone', 4),
('level_5', 'Guerreiro', 'Alcançou o Level 5', '⚔️', 'level', 400, 'rare', 'milestone', 5),
('level_6', 'Elite', 'Alcançou o Level 6', '🛡️', 'level', 800, 'epic', 'milestone', 6),
('level_7', 'Lendário', 'Alcançou o Level 7', '🏛️', 'level', 1500, 'epic', 'milestone', 7),
('level_8', 'FitQuest Master', 'Alcançou o Level 8 — você é uma lenda', '👑', 'level', 5000, 'legendary', 'milestone', 8);

-- ════════════════════════════════════════════════════════════════
-- EXERCÍCIOS GLOBAIS
-- ════════════════════════════════════════════════════════════════

INSERT INTO exercises (name, muscle_group, equipment, is_global, instructions) VALUES
-- Peito
('Supino Reto', 'chest', 'barbell', TRUE, 'Deite no banco reto, segure a barra um pouco mais larga que os ombros, desça controlado até o peito e empurre de volta.'),
('Supino Inclinado', 'chest', 'barbell', TRUE, 'Banco inclinado 30-45°. Mesma execução do supino reto, foca no peitoral superior.'),
('Supino com Halteres', 'chest', 'dumbbell', TRUE, 'Halteres em vez de barra. Permite maior amplitude de movimento.'),
('Crucifixo com Halteres', 'chest', 'dumbbell', TRUE, 'Isola o peitoral. Braços semi-flexionados, abrir e fechar.'),
('Crossover', 'chest', 'cable', TRUE, 'Polias altas. Cruze as mãos à frente do corpo contraindo o peito.'),
('Flexão de Braço', 'chest', 'bodyweight', TRUE, 'Mãos no chão, corpo reto, desce e sobe.'),

-- Costas
('Levantamento Terra', 'back', 'barbell', TRUE, 'Pés na largura do quadril, barra sobre os pés. Levante mantendo a coluna neutra.'),
('Barra Fixa', 'back', 'bodyweight', TRUE, 'Pegada pronada, subir até o queixo passar a barra.'),
('Remada Curvada', 'back', 'barbell', TRUE, 'Tronco a 45°, puxar a barra até a cintura.'),
('Remada Unilateral', 'back', 'dumbbell', TRUE, 'Joelho no banco, puxar o halter até a cintura.'),
('Puxada na Frente', 'back', 'cable', TRUE, 'Polia alta, puxar até a clavícula.'),
('Remada Sentada', 'back', 'cable', TRUE, 'Sentado, puxar o cabo até o abdômen.'),

-- Pernas
('Agachamento Livre', 'legs', 'barbell', TRUE, 'Barra nas costas, descer até paralelo ou abaixo, subir empurrando o chão.'),
('Leg Press 45°', 'legs', 'machine', TRUE, 'Pés na plataforma, empurrar mantendo joelhos alinhados.'),
('Cadeira Extensora', 'legs', 'machine', TRUE, 'Sentado, estender as pernas. Isola o quadríceps.'),
('Mesa Flexora', 'legs', 'machine', TRUE, 'Deitado, flexionar as pernas. Isola posterior de coxa.'),
('Stiff', 'legs', 'barbell', TRUE, 'Pernas semi-flexionadas, descer a barra mantendo coluna reta.'),
('Avanço', 'legs', 'dumbbell', TRUE, 'Passada longa, descer até joelho de trás quase tocar o chão.'),
('Panturrilha em Pé', 'legs', 'machine', TRUE, 'Subir e descer na ponta dos pés com peso.'),

-- Ombros
('Desenvolvimento Militar', 'shoulders', 'barbell', TRUE, 'Em pé, empurrar a barra acima da cabeça.'),
('Desenvolvimento com Halteres', 'shoulders', 'dumbbell', TRUE, 'Sentado ou em pé, halteres acima da cabeça.'),
('Elevação Lateral', 'shoulders', 'dumbbell', TRUE, 'Halteres ao lado, elevar até a linha do ombro.'),
('Elevação Frontal', 'shoulders', 'dumbbell', TRUE, 'Halteres à frente, elevar até a linha do ombro.'),
('Crucifixo Invertido', 'shoulders', 'dumbbell', TRUE, 'Curvado, abrir os braços. Foca posterior de ombro.'),

-- Braços
('Rosca Direta', 'arms', 'barbell', TRUE, 'Bíceps. Em pé, flexionar os cotovelos.'),
('Rosca Alternada', 'arms', 'dumbbell', TRUE, 'Alternando os braços, com supinação.'),
('Rosca Martelo', 'arms', 'dumbbell', TRUE, 'Pegada neutra (palmas para dentro).'),
('Tríceps Pulley', 'arms', 'cable', TRUE, 'Polia alta, empurrar para baixo mantendo cotovelos fixos.'),
('Tríceps Francês', 'arms', 'dumbbell', TRUE, 'Halter atrás da cabeça, estender os cotovelos.'),
('Mergulho em Paralelas', 'arms', 'bodyweight', TRUE, 'Subir e descer entre paralelas. Tríceps e peito.'),

-- Core
('Prancha', 'core', 'bodyweight', TRUE, 'Apoio em antebraços e pontas dos pés, corpo reto. Sustentar.'),
('Abdominal Reto', 'core', 'bodyweight', TRUE, 'Deitado, elevar o tronco contraindo o abdômen.'),
('Abdominal Oblíquo', 'core', 'bodyweight', TRUE, 'Levar cotovelo ao joelho oposto.'),
('Prancha Lateral', 'core', 'bodyweight', TRUE, 'Apoio em um antebraço, corpo de lado, alinhado.'),
('Elevação de Pernas', 'core', 'bodyweight', TRUE, 'Deitado, elevar as pernas até 90°.'),

-- Cardio
('Corrida', 'cardio', 'bodyweight', TRUE, 'Esteira ou rua. Tracking por distância e tempo.'),
('Esteira', 'cardio', 'machine', TRUE, 'Caminhada ou corrida em esteira.'),
('Bicicleta Ergométrica', 'cardio', 'machine', TRUE, 'Pedalar em bicicleta estacionária.'),
('Pular Corda', 'cardio', 'bodyweight', TRUE, 'Pulos contínuos com corda.'),
('Burpee', 'cardio', 'bodyweight', TRUE, 'Agachar, prancha, flexão, pulo. Full body intenso.'),
('HIIT', 'cardio', 'bodyweight', TRUE, 'Treino intervalado de alta intensidade.');

-- ════════════════════════════════════════════════════════════════
-- CATEGORIAS FINANCEIRAS GLOBAIS
-- ════════════════════════════════════════════════════════════════

INSERT INTO finance_categories (name, type, icon, color, is_global) VALUES
-- Despesas
('Alimentação', 'expense', '🍔', '#F97316', TRUE),
('Mercado', 'expense', '🛒', '#10B981', TRUE),
('Transporte', 'expense', '🚗', '#3B82F6', TRUE),
('Combustível', 'expense', '⛽', '#EF4444', TRUE),
('Moradia', 'expense', '🏠', '#8B5CF6', TRUE),
('Contas (Luz, Água, Net)', 'expense', '💡', '#F59E0B', TRUE),
('Saúde', 'expense', '⚕️', '#EC4899', TRUE),
('Academia', 'expense', '💪', '#FF4D00', TRUE),
('Educação', 'expense', '📚', '#06B6D4', TRUE),
('Lazer', 'expense', '🎮', '#A855F7', TRUE),
('Streaming', 'expense', '📺', '#6366F1', TRUE),
('Roupas', 'expense', '👕', '#14B8A6', TRUE),
('Presentes', 'expense', '🎁', '#F43F5E', TRUE),
('Pets', 'expense', '🐶', '#84CC16', TRUE),
('Viagem', 'expense', '✈️', '#0EA5E9', TRUE),
('Outros', 'expense', '📌', '#71717A', TRUE),

-- Receitas
('Salário', 'income', '💼', '#10B981', TRUE),
('Freelance', 'income', '💻', '#3B82F6', TRUE),
('Investimentos', 'income', '📈', '#7C3AED', TRUE),
('Vendas', 'income', '💰', '#F59E0B', TRUE),
('Bônus', 'income', '🎉', '#EC4899', TRUE),
('Outras Receitas', 'income', '➕', '#71717A', TRUE);

-- ════════════════════════════════════════════════════════════════
-- ✅ Seed completo. Banco pronto para uso.
-- ════════════════════════════════════════════════════════════════
