class PlayerGameState
  def initialize(board, moves, expiration)
    raise TypeError, "Board must be an Array" unless board.is_a?(Array)
    raise ArgumentError, "Board must be of length 4" unless board.length == 4
    raise ArgumentError, "Board must be an Array of Arrays with length 4." unless (
      board.all? { |row| row.is_a?(Array) && row.length == 4  }
    )
    raise TypeError, "Moves must be an Array of Strings" unless (
      moves.is_a?(Array) && moves.all? { |move| move.is_a?(String) }
    )
    raise TypeError, "Expiration must be a DateTime" unless expiration.is_a?(Time)

    @board = board.map(&:freeze).freeze
    @moves = moves.freeze
    @expiration = expiration
  end

  attr_reader :board
  attr_reader :moves
  attr_reader :expiration

  def to_hash
    {
      board: @board,
      moves: @moves,
      expiration: @expiration.tv_sec
    }
  end

  def add_move(move)
    raise TypeError, "Move must be a String." unless move.is_a?(String)
    raise ArgumentError, "Move must be at least 3 letters" unless move.length >= 3

    PlayerGameState.new(@board, @moves + [move], @expiration)
  end

  def self.deserialize(hash)
    PlayerGameState.new(hash["board"], hash["moves"], Time.at(Integer(hash["expiration"])))
  end
end
