class Dictionary
  def initialize(words)
    raise TypeError "" unless words.is_a? Array
    @words = words
  end

  attr_reader :words

  def is_word?(word)
    !(@words.bsearch { |v| word.casecmp(v) }).nil?
  end
end
