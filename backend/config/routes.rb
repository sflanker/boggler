Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  resource :games, only: [:create]

  post '/move', to: 'games#move'
  post '/score', to: 'games#score'
end
