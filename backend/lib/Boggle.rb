require 'securerandom'

BOGGLE_DICE = [
    "bfiorx".chars.freeze,
    "eefhiy".chars.freeze,
    "denosw".chars.freeze,
    "dknotu".chars.freeze,
    "ahmors".chars.freeze,
    "elpstu".chars.freeze,
    "aaciot".chars.freeze,
    "egkluy".chars.freeze,
    "abjmoq".chars.freeze,
    "ehinps".chars.freeze,
    "egintv".chars.freeze,
    "abilty".chars.freeze,
    "adenvz".chars.freeze,
    "acelrs".chars.freeze,
    "gilruw".chars.freeze,
    "acdemp".chars.freeze
].freeze

class Boggle
  def self.roll_dice
    board = [[]]
    (BOGGLE_DICE.map { |die| die[SecureRandom.random_number(6)] }).each do |die|
      board[-1].length == 4 ? board << [die] : board[-1] << die
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
        end
      end
    end

    while queue.length > 0
      current = queue.shift
      adjacent = get_adjacent current[:positions][-1]
      matches =
          adjacent.filter {|(i, j)| board[i][j] == current[:remaining][0] && !current[:positions].include?([i, j])}
      matches.each do |match|
        if current[:remaining].length == 1
          # success
          return true
        end
        queue << {positions: current[:positions] + [match], remaining: current[:remaining][1..-1]}
      end
    end

    return false
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
