require_relative './Dictionary'

ENGLISH_WORDS = File.readlines("./vendor/english_words.txt").map(&:chomp)

class EnglishDictionary < Dictionary
  def initialize
    super(ENGLISH_WORDS)
  end
end
