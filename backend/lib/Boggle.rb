require 'securerandom'

BOGGLE_DICE = [
  "bfiorx",
  "eefhiy",
  "denosw",
  "dknotu",
  "ahmors",
  "elpstu",
  "aaciot",
  "egkluy",
  "abjmoq",
  "ehinps",
  "egintv",
  "abilty",
  "adenvz",
  "acelrs",
  "gilruw",
  "acdemp"
].map(&:chars).map(&:freeze).freeze

SCORES = [
  {len: 8, score: 11},
  {len: 7, score: 5},
  {len: 6, score: 3},
  {len: 5, score: 2},
  {len: 3, score: 1}
].map(&:freeze).freeze

class Boggle
  def self.roll_dice
    board = [[]]
    dice = Array.new(BOGGLE_DICE)
    (0..15).each do |_|
      # pick a random die
      die = dice.delete_at(SecureRandom.random_number(dice.length))
      letter = die[SecureRandom.random_number(6)]
      board[-1].length == 4 ? board << [letter] : board[-1] << letter
    end
    board
  end

  def self.is_valid_move?(board, move)
    # breadth first search for the move on the board
    queue = []
    (0..3).each do |i|
      (0..3).each do |j|
        if move[0] == board[i][j]
          queue << {positions: [[i, j]], remaining: move[1..-1]}

          if move[0] == "q" && move[1] == "u"
            # Throw in a free U with every Q
            queue << {positions: [[i, j]], remaining: move[2..-1]}
          end
        end
      end
    end

    while queue.length > 0
      current = queue.shift
      positions = current[:positions]
      remaining = current[:remaining]
      adjacent = get_adjacent positions[-1]
      matches =
          adjacent.filter {|(i, j)| board[i][j] == remaining[0] && !positions.include?([i, j])}
      matches.each do |match|
        if remaining.length == 1
          # success
          return true
        end
        queue << {positions: positions + [match], remaining: remaining[1..-1]}
        if remaining[0] == "q" && remaining[1] == "u"
          # Throw in a free U with every Q
          if remaining.length == 2
            # success
            return true
          end
          queue << {positions: positions + [match], remaining: remaining[2..-1]}
        end
      end
    end

    return false
  end

  def self.score_word(word)
    entry = SCORES.bsearch {|s| s[:len] <= word.length}
    entry.nil? ? 0 : entry[:score]
  end

  private

  def self.get_adjacent((i, j))
    adjacent = []
    (i-1..i+1).each do |adj_i|
      (j-1..j+1).each do |adj_j|
        if adj_i >= 0 && adj_i <= 3 && adj_j >= 0 && adj_j <= 3 && [i, j] != [adj_i, adj_j]
          adjacent << [adj_i, adj_j]
        end
      end
    end

    adjacent
  end
end
