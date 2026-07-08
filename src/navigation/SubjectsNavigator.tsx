import {
  SafeAreaView,
  Text,
  View,
} from "react-native";


// 🧠 TELA DE DETALHES DA MATÉRIA

export default function SubjectDetailsScreen() {


  return (

    <SafeAreaView

      style={{
        flex:1,
        backgroundColor:"#080810",
        padding:20,
      }}

    >


      {/* HEADER */}

      <Text

        style={{
          color:"white",
          fontSize:28,
          fontWeight:"700",
        }}

      >

        📘 Detalhes da Matéria

      </Text>



      {/* CARD INICIAL */}

      <View

        style={{
          marginTop:20,
          backgroundColor:"#161625",
          padding:20,
          borderRadius:15,
        }}

      >

        <Text

          style={{
            color:"white",
            fontSize:20,
            fontWeight:"600",
          }}

        >

          Nenhuma matéria selecionada

        </Text>


        <Text

          style={{
            color:"#888",
            marginTop:10,
          }}

        >

          Aqui aparecerão conteúdos,
          datas e evolução.

        </Text>


      </View>



      {/* CONTEÚDOS */}

      <View

        style={{
          marginTop:20,
        }}

      >

        <Text

          style={{
            color:"white",
            fontSize:18,
            fontWeight:"700",
          }}

        >

          📚 Conteúdos

        </Text>


        <Text

          style={{
            color:"#888",
            marginTop:8,
          }}

        >

          Nenhum conteúdo adicionado.

        </Text>


      </View>



      {/* EVENTOS */}

      <View

        style={{
          marginTop:20,
        }}

      >

        <Text

          style={{
            color:"white",
            fontSize:18,
            fontWeight:"700",
          }}

        >

          📅 Datas importantes

        </Text>


        <Text

          style={{
            color:"#888",
            marginTop:8,
          }}

        >

          Nenhuma data cadastrada.

        </Text>


      </View>



    </SafeAreaView>

  );

}