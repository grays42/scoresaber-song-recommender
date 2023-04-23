require 'sinatra'
require 'httparty'
require 'json'

set :public_folder, 'public'
set :views, 'views'

get '/' do
  erb :index
end

post '/submit' do
    user_id = params[:user_id]
    "You submitted the user ID: #{user_id}"
  end
