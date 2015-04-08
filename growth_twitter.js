Array.prototype.diff = function(a) {
    return this.filter(function(i) {
        return a.indexOf(i) < 0;
    });
};

var min15 = 15 * 60 * 1000 ;
var min5 = 5 * 60 *1000 ;
var min1 = 1 * 60 *1000 ;

var friends = [];

var mySelf = {
    twit: null,
    api: {
        //followers/ids => Obtiene los usuarios que yo sigo, Solo sus IDs
        followersId: function(params, _fun) {
            mySelf.twit.get('followers/ids', params, function(error, tweets, response) {
                if (error) {
                    console.log(error);
                    return;
                }
				_fun(JSON.parse(response.body).ids, error);
            });
        },
        //followers/list Cursor que obtiene los usuarios de 100 en 100
        _getFollowersNextCursor: function function_name(params, _fun) {
            mySelf.twit.get('followers/list', params, function(error, tweets, response) {
                if (error) {
                    console.log(error);
                    return;
                }
				_fun(JSON.parse(response.body), error);
            });
        },
        // followers/list => Obtiene listado de los seguidores de una cuenta con TODA su informacion
        followers: function(params, _fun) {
            mySelf.api._getFollowersNextCursor(params, function(response, error) {
                mySelf.api._followers.push.apply(mySelf.api._followers, response.users);
                if (response.next_cursor > 0) {
                    params.cursor = response.next_cursor;
                    mySelf.api.followers(params, _fun);
                } else {
                    _fun(mySelf.api._followers, error);
                }
                if (error){
            		_fun(mySelf.api._followers, error);
            	}
            });
        },
        //friends/ids => Listado de usuarios que siguen a la cuenta, Solo sus IDs 
        friendsId: function(params, _fun) {

            mySelf.twit.get('friends/ids', params, function(error, tweets, response) {
                if (error) {
                    console.log(error);
                    return;
                }
				_fun(JSON.parse(response.body).ids, error);
            });
        },
        //friendships/create => Seguir a un Usuario
        follow: function(params, _fun, mySelf) {
            mySelf.twit.post('friendships/create', params, function(error, tweets, response) {
                if (error) {
                    console.log(error);					
                }
                _fun(!error, error);
            });
        },
        //friendships/destroy => Dejar de seguir a un Usuario
        unfollow: function(params, _fun) {
            mySelf.twit.post('friendships/destroy', params, function(error, tweets, response) {
                if (error) {
                    console.log(error);
                }
                _fun(!error, error);
            });
        },
        //users/show => Obtiene un Usuario con TODA su información
        user: function(params, _fun) {
            mySelf.twit.get('users/show', params, function(error, tweets, response) {
                if (error) {
                    console.log(error);
                    return;
                }
				_fun(JSON.parse(response.body), error);
            });
        },
        //users/lookup => Obtiene Grupos de hasta 100 Usuario con TODA su información
        users: function(params, _fun, mySelf) {

            mySelf.twit.get('users/lookup', params, function(error, tweets, response) {
                if (error) {
                    console.log(error);
                    return;
                }
				_fun(JSON.parse(response.body), error);
				
            });
        },
        _followers: []
    },
    unfollowNoFans: function(params) {
        var yoSigo;
        var meSiguen;
        var dejarDeSeguir;
        //Obtenemos a todos los usuarios que yo sigo.
        mySelf.api.followersId(params, function(ids, error) {
            yoSigo = ids;
            //Obtenemos a todos los usuarios que me siguen;
            mySelf.api.friendsId(params, function(ids, error) {
                meSiguen = ids;
                //Obtenemos aquellos a los que yo sigo pero que no me siguen, y le resto los medios digitales.
                dejarDeSeguir = meSiguen.diff(yoSigo).diff(friends);
                //Dejo de seguir a cada uno de ellos.
                for (var i = 0; i < dejarDeSeguir.length; i++) {
                    mySelf.api.unfollow({user_id: dejarDeSeguir[i]}, function() {
                    });
                }
            });
        });
    },
    growth: function(paramsUser, paramsToCopy) {
        //Obtengo los seguidores de la cuenta seleccionada
        mySelf.api.followersId(paramsToCopy, function(ids, error) {
        	var loSiguen = ids;
            //Los divido en bloques deacuerdo a los limites de la API de Twitter (100 Max)
			var grupos = parseInt(ids.length / 100);
			for(var i=0;i<grupos;i++){
                //Genero el Array de Ids de Usuarios a Seguir
				var subArrayStr = ids.slice(i*100,(i*100) + 99).join(",");
                //Separo en bloques de tiempo para considerar limites de 15 Min de Twitter
                setTimeout(function (subArrayStr, mySelf) {
                    //Obtengo Datos de los Usuairos Solicitados
    				mySelf.api.users({user_id: subArrayStr}, function(users, error) {
    					if(error){
    						console.log(error);
    						return false;
    					};
                        //Recorro los usuarios
    					for(var u in users){
    						var user = users[u];
                            //Evaluo calidad del perfil.
        					if (user.default_profile_image === false && user.description.length > 1 && user.follow_request_sent === false) {
                                //Si concuerda con criterios le mando solicitud de Seguimiento
        						mySelf.api.follow({user_id: user.id}, function(success, error) {
        							if (error) {
        								console.log("Error");
        							}
        						},mySelf);
        						console.log("Now following ", user.id);
        					}
    					}
    				},mySelf);
				},min5 * i, subArrayStr, mySelf);
                //Envio al setTimeout variables de la iteración.
			}   
        });
    },
	connectToTwitter : function(_fun){
		var twitter = require('twitter');
        //Leemos la Cuenta.
        var twit = new twitter({
            consumer_key: <consumer_key>,
            consumer_secret: <consumer_secret>,
            access_token_key: <access_token_key>,
            access_token_secret: <access_token_secret>
        });
		mySelf.twit = twit;
		_fun(twit);
	},
    go:function(){
        var params = {
                screen_name: <Your Name>
            };
            var paramsToCopy = {
                screen_name: 'PDI_CHILE',
                include_entities: false
            };
            console.log("Copiando a: ", paramsToCopy.screen_name);
            

            //PARA DEJAR DE SEGUIR A LOS QUE NO TE SIGUEN SI YA ALCANSASTE EL LIMITE, DESCOMENTA LA SIG. LINEA
            //mySelf.unfollowNoFans(params);
            var paramsObj = {};
            paramsObj.params = params;
            paramsObj.paramsToCopy = paramsToCopy;
            setTimeout(function(mySelf,paramsObj){
                mySelf.growth(params, paramsToCopy);    
            },min5,mySelf,paramsObj);
    }
};
//module.exports = mySelf;

mySelf.connectToTwitter(function (twit) {
    console.log("Go Go Go...");
    mySelf.go();
})