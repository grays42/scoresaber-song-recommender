require 'sinatra'
require 'httparty'
require 'json'

set :public_folder, 'public'
set :views, 'views'

get '/' do
  erb :index
end

post '/' do

end
