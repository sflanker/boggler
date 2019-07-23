require 'jwt'

require './lib/Boggle'
require './lib/EnglishDictionary'
require './app/view-models/PlayerGameState'

JWT_ALGORITHM = "HS256"

class GamesController < ApplicationController
  def initialize
    @private_key = Rails.application.secrets["jwt_private_key"]
  end

  def create
    state = PlayerGameState.new(Boggle.roll_dice, [], Time.now + (3 * 60))
    puts "Generated Game: #{state}"
    render json: {
      state: state,
      current_time: Time.now.tv_sec,
      state_token: JWT.encode(state.to_hash, @private_key, JWT_ALGORITHM)
    }
  end

  def move
    begin
      params.require(:state_token)
      params.require(:move)
    rescue ActionController::ParameterMissing => err
      return render({
        status: 400,
        json: { code: "PARAMETER_MISSING", message: "The required parameter '#{err.param}' was not specified." }
      })
    end

    current_time = Time.now
    state_token = params[:state_token]
    # TODO handle error, return HTTP 400
    state =
        begin
          PlayerGameState.deserialize(JWT.decode(state_token, @private_key, true)[0])
        rescue JWT::DecodeError
          nil
        end
    if state.nil?
      return render({
        status: 400,
        json: { code: "INVALID_STATE_TOKEN", message: "The specified state token is not valid" }
      })
    end
    move = params[:move].downcase

    # TODO allow game to have a language, get corresponding dictionary
    dictionary = EnglishDictionary.new

    on_invalid = ->(reason) { invalid_move(state, current_time, state_token, reason) }

    if !params[:debug] && current_time > state.expiration
      on_invalid.call("Game timer expired.")
    elsif !move.is_a?(String) || move.length < 3 || !dictionary.is_word?(move)
      on_invalid.call("The specified word is not valid.")
    elsif state.moves.include? move
      on_invalid.call("The specified word has already been played.")
    elsif !Boggle.is_valid_move?(state.board, move)
      on_invalid.call("The specified word could not be found on the board.")
    else
      new_state = state.add_move move
      render json: {
        state: new_state,
        current_time: current_time.tv_sec,
        state_token: JWT.encode(new_state.to_hash, @private_key, JWT_ALGORITHM),
        move_valid: true
      }
    end
  end

  private

  def invalid_move(state, current_time, state_token, reason)
    render json: {
      state: state,
      current_time: current_time.tv_sec,
      state_token: state_token,
      move_valid: false,
      reason: reason
    }
  end
end
